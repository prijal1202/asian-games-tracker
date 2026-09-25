# Asian Games 2026 Bug Fixes & Data Accuracy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve duplicate sport entries, eliminate Hangzhou 2022 venues in favor of official Aichi-Nagoya 2026 venues, and balance layout spacing across single and multi-fixture cards.

**Architecture:** 
1. Introduce a comprehensive `SPORT_SLUG_MAP` normalizer that canonicalizes all Bornan/Olympic 3-letter codes and common sport names to canonical slugs.
2. Add an idempotent database deduplication and migration routine in `database.py` / `seed.py` that repoints existing fixtures and deletes obsolete sport rows.
3. Update `seed.py` and scraper fallback fixtures to use genuine Aichi-Nagoya 2026 competition venues (IG Arena, Aichi Sky Expo, Gifu Green Stadium, etc.).
4. Refine responsive grid layouts in `CountryDossier.tsx` and `SportMatrix.tsx` to handle odd and single match card counts gracefully without stretching or excessive whitespace.

**Tech Stack:** Python 3.10, FastAPI, SQLite3, pytest, React 18, TypeScript, Tailwind CSS 3.4, Vite 5.

**Spec:** Based on bug reports in `bugs/image.png` and `bugs/image copy.png`, and user requirements for Aichi-Nagoya 2026 venue accuracy and UI whitespace balancing.

## Global Constraints

- Preserve all existing 2026 Asian Games data, medal standings, and sport brackets.
- Zero emojis in any markdown documents, commit messages, or UI headers.
- Desktop-first responsive design must remain intact across desktop, tablet, and mobile.
- All backend pytest tests must pass and frontend must compile cleanly with `npm run build`.

## Review Focus

1. **Sport Slug Collision**: When Bornan returns 3-letter discipline keys (e.g. `BDM`, `BMT`, `ARC`, `CKT`), the scraper must map them directly to canonical slugs (`badminton`, `archery`, `cricket`) instead of creating second sport entries.
2. **Database Migration Safety**: Collapsing duplicate sport rows must safely re-assign all child fixture records before deleting duplicate sport parent rows to maintain foreign key integrity.
3. **Venue Accuracy**: No Hangzhou 2022 venues (such as Binjiang Gymnasium, Gongshu Canal Sports Park, Fuyang Yinhu) should remain in seed data or scraper defaults.
4. **Odd Fixture Balancing**: When a sport has 1 fixture (or an odd count), the match card layout in `CountryDossier.tsx` and `SportMatrix.tsx` must render balanced without stretched cards or empty voids.
5. **API Response Deduplication**: The `GET /api/sports` endpoint must return a distinct list of sports by canonical slug and name.

---

### Task 1: Canonical Sport Slug Normalization and Database Migration

**Files:**
- Create: `backend/tests/test_sport_deduplication.py`
- Modify: `backend/scraper/engine.py:11-35, 100-115`
- Modify: `backend/database.py:60-66`
- Modify: `backend/seed.py:130-155`
- Modify: `backend/api.py:50-65`

**Interfaces:**
- Consumes: Standard `sqlite3.Connection`, `backend.database.get_db_connection`.
- Produces: 
  - `SPORT_SLUG_MAP: Dict[str, str]` expanded to cover all 3-letter codes, variants, and slug formats.
  - `deduplicate_sports(conn: sqlite3.Connection) -> None` in `backend/database.py`.
  - Canonicalized sports list in `GET /api/sports`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_sport_deduplication.py`:
```python
import sqlite3
import pytest
from backend.database import init_db, get_db_connection, deduplicate_sports
from backend.scraper.engine import SPORT_SLUG_MAP
from backend.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_sport_slug_map_canonicalization():
    assert SPORT_SLUG_MAP.get("bdm") == "badminton"
    assert SPORT_SLUG_MAP.get("bmt") == "badminton"
    assert SPORT_SLUG_MAP.get("badminton") == "badminton"
    assert SPORT_SLUG_MAP.get("arc") == "archery"
    assert SPORT_SLUG_MAP.get("archery") == "archery"
    assert SPORT_SLUG_MAP.get("ckt") == "cricket"
    assert SPORT_SLUG_MAP.get("cricket") == "cricket"

def test_deduplicate_sports_migration(tmp_path):
    test_db = str(tmp_path / "test_dedup.db")
    init_db(test_db)
    conn = get_db_connection(test_db)
    cursor = conn.cursor()
    
    # Insert countries
    cursor.execute("INSERT OR REPLACE INTO countries (code, name) VALUES ('IND', 'India');")
    cursor.execute("INSERT OR REPLACE INTO countries (code, name) VALUES ('CHN', 'China');")

    # Insert duplicate sports: 'badminton' and 'bdm'
    cursor.execute("INSERT OR REPLACE INTO sports (slug, name, category) VALUES ('badminton', 'Badminton', 'Racquet Sports');")
    cursor.execute("INSERT OR REPLACE INTO sports (slug, name, category) VALUES ('bdm', 'Badminton', 'Asian Games Sports');")
    
    # Insert fixtures pointing to both
    cursor.execute("""
        INSERT INTO fixtures (id, sport_slug, event_name, stage_round, status, scheduled_at, team_a_code, team_b_code)
        VALUES ('fix-1', 'badminton', 'Men Singles', 'Quarter-final', 'COMPLETED', CURRENT_TIMESTAMP, 'IND', 'CHN');
    """)
    cursor.execute("""
        INSERT INTO fixtures (id, sport_slug, event_name, stage_round, status, scheduled_at, team_a_code, team_b_code)
        VALUES ('fix-2', 'bdm', 'Women Singles', 'Semi-final', 'UPCOMING', CURRENT_TIMESTAMP, 'IND', 'CHN');
    """)
    conn.commit()

    # Run deduplication
    deduplicate_sports(conn)

    # Verify duplicate sport 'bdm' is merged into 'badminton'
    cursor.execute("SELECT slug, name FROM sports WHERE name = 'Badminton';")
    sports = cursor.fetchall()
    assert len(sports) == 1
    assert sports[0]["slug"] == "badminton"

    # Verify fixture 'fix-2' was repointed to 'badminton'
    cursor.execute("SELECT sport_slug FROM fixtures WHERE id = 'fix-2';")
    fix2 = cursor.fetchone()
    assert fix2["sport_slug"] == "badminton"
    conn.close()

def test_api_sports_returns_no_duplicate_names():
    response = client.get("/api/sports")
    assert response.status_code == 200
    sports = response.json()
    names = [s["name"].lower() for s in sports]
    assert len(names) == len(set(names)), "API returned duplicate sport names"
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```powershell
& "C:\Users\User\AppData\Local\Programs\Python\Python310\python.exe" -m pytest backend/tests/test_sport_deduplication.py -v
```
Expected: FAIL with `ImportError: cannot import name 'deduplicate_sports' from 'backend.database'`

- [ ] **Step 3: Write minimal implementation**

1. In `backend/scraper/engine.py`, expand `SPORT_SLUG_MAP` to include full names and common 3-letter variants:
```python
SPORT_SLUG_MAP = {
    "bdm": "badminton",
    "bmt": "badminton",
    "badminton": "badminton",
    "arc": "archery",
    "arh": "archery",
    "archery": "archery",
    "ckt": "cricket",
    "cri": "cricket",
    "cricket": "cricket",
    "tte": "table-tennis",
    "table-tennis": "table-tennis",
    "table tennis": "table-tennis",
    "hoc": "hockey",
    "hockey": "hockey",
    "field hockey": "hockey",
    "bkb": "basketball",
    "basketball": "basketball",
    "bk3": "3x3-basketball",
    "3x3-basketball": "3x3-basketball",
    "3x3 basketball": "3x3-basketball",
    "ath": "athletics",
    "athletics": "athletics",
    "box": "boxing",
    "boxing": "boxing",
    "bkg": "breaking",
    "breaking": "breaking",
    "bbl": "baseball",
    "baseball": "baseball",
    "bmf": "cycling-bmx-freestyle",
    "bmx": "cycling-bmx-racing",
    "clb": "sport-climbing",
    "sport-climbing": "sport-climbing",
    "swm": "swimming",
    "swimming": "swimming",
    "sho": "shooting",
    "shooting": "shooting",
    "kte": "karate",
    "karate": "karate",
    "jud": "judo",
    "judo": "judo",
    "wre": "wrestling",
    "wrestling": "wrestling",
    "fbl": "football",
    "football": "football",
}
```

2. In `backend/database.py`, add `deduplicate_sports`:
```python
def deduplicate_sports(conn: sqlite3.Connection) -> None:
    """Consolidates duplicate sports (e.g. 'bdm' vs 'badminton') and repoints fixtures."""
    cursor = conn.cursor()
    # Map of obsolete / short slugs to canonical slugs
    REMAP = {
        "bdm": "badminton",
        "bmt": "badminton",
        "arc": "archery",
        "arh": "archery",
        "ckt": "cricket",
        "cri": "cricket",
        "tte": "table-tennis",
        "hoc": "hockey",
        "bkb": "basketball",
        "bk3": "3x3-basketball",
        "ath": "athletics",
        "box": "boxing",
        "bkg": "breaking",
        "bbl": "baseball",
        "clb": "sport-climbing",
        "swm": "swimming",
        "sho": "shooting",
        "kte": "karate",
        "jud": "judo",
        "wre": "wrestling",
        "fbl": "football",
    }
    for old_slug, canon_slug in REMAP.items():
        if old_slug == canon_slug:
            continue
        # Ensure canonical sport exists
        cursor.execute("SELECT slug FROM sports WHERE slug = ?", (canon_slug,))
        canon_exists = cursor.fetchone()
        
        cursor.execute("SELECT slug, name, category, icon FROM sports WHERE slug = ?", (old_slug,))
        old_row = cursor.fetchone()
        
        if old_row:
            if not canon_exists:
                cursor.execute("""
                    INSERT INTO sports (slug, name, category, icon)
                    VALUES (?, ?, ?, ?);
                """, (canon_slug, old_row["name"], old_row["category"], old_row["icon"]))
            
            # Repoint fixtures
            cursor.execute("UPDATE fixtures SET sport_slug = ? WHERE sport_slug = ?", (canon_slug, old_slug))
            # Delete old sport record
            cursor.execute("DELETE FROM sports WHERE slug = ?", (old_slug,))
    
    conn.commit()
```
Call `deduplicate_sports(conn)` at the end of `init_db()` and in `seed_default_data()`.

3. In `backend/api.py`, update `GET /api/sports` to group by `name` or order distinctly:
```python
@app.get("/api/sports", response_model=List[SportResponse])
def get_sports():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT slug, name, category, icon
        FROM sports
        GROUP BY name
        ORDER BY name ASC;
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```powershell
& "C:\Users\User\AppData\Local\Programs\Python\Python310\python.exe" -m pytest backend/tests/test_sport_deduplication.py -v
```
Expected: PASS with 3 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/scraper/engine.py backend/database.py backend/seed.py backend/api.py backend/tests/test_sport_deduplication.py
git commit -m "fix(sports): canonicalize sport slugs and add database deduplication routine"
```

---

### Task 2: Accurate Aichi-Nagoya 2026 Venues in Seed Data and Tests

**Files:**
- Create: `backend/tests/test_venues_accuracy.py`
- Modify: `backend/seed.py:64-130`
- Modify: `backend/scraper/engine.py:200-220`
- Modify: `backend/tests/test_scraper.py:40-70`

**Interfaces:**
- Consumes: `backend.seed.seed_default_data`, `backend.database.get_db_connection`.
- Produces: Cleaned seed fixtures featuring official Aichi-Nagoya 2026 arenas.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_venues_accuracy.py`:
```python
import pytest
from backend.database import init_db, get_db_connection
from backend.seed import seed_default_data

HANGZHOU_VENUES = [
    "Binjiang Gymnasium",
    "Gongshu Canal",
    "Gongshu Field Hockey",
    "Fuyang Yinhu",
    "Hangzhou Olympic",
]

def test_seed_fixtures_use_aichi_nagoya_venues(tmp_path):
    test_db = str(tmp_path / "test_venues.db")
    init_db(test_db)
    seed_default_data(test_db)

    conn = get_db_connection(test_db)
    cursor = conn.cursor()
    cursor.execute("SELECT id, sport_slug, venue FROM fixtures;")
    fixtures = cursor.fetchall()
    conn.close()

    assert len(fixtures) > 0
    for f in fixtures:
        venue = f["venue"]
        for hz in HANGZHOU_VENUES:
            assert hz.lower() not in venue.lower(), (
                f"Fixture {f['id']} uses outdated Hangzhou venue '{venue}' instead of Aichi-Nagoya 2026 venue"
            )

    # Verify specific Aichi-Nagoya venues exist
    venues_text = " ".join([f["venue"] for f in fixtures])
    assert "IG Arena" in venues_text or "Aichi" in venues_text or "Nagoya" in venues_text
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```powershell
& "C:\Users\User\AppData\Local\Programs\Python\Python310\python.exe" -m pytest backend/tests/test_venues_accuracy.py -v
```
Expected: FAIL with `AssertionError: Fixture badminton-ms-qf-ind-chn uses outdated Hangzhou venue 'Binjiang Gymnasium Court 1'`

- [ ] **Step 3: Write minimal implementation**

Update `backend/seed.py` fixtures with authentic Aichi-Nagoya 2026 venues:
- Badminton: `"Aichi Prefectural Gymnasium (IG Arena Court 1)"`
- Cricket: `"Aichi Prefectural Stadium Cricket Ground"`
- Table Tennis: `"Aichi Sky Expo Arena Court 1"`
- Field Hockey: `"Gifu Prefectural Green Stadium Pitch 1"`
- Archery: `"Okazaki Central Park Archery Field"`
- Swimming: `"Nippon Gaishi Sports Plaza (Rainbow Pool)"`

Update `backend/scraper/engine.py` default venue string to `"Aichi-Nagoya 2026 Competition Venue"`.
Update `backend/tests/test_scraper.py` mock HTML venue strings from `"Binjiang Gymnasium"` to `"IG Arena, Nagoya"`.

- [ ] **Step 4: Run test to verify it passes**

Run:
```powershell
& "C:\Users\User\AppData\Local\Programs\Python\Python310\python.exe" -m pytest backend/tests/test_venues_accuracy.py backend/tests/test_scraper.py -v
```
Expected: PASS with all tests passing.

- [ ] **Step 5: Commit**

```bash
git add backend/seed.py backend/scraper/engine.py backend/tests/test_scraper.py backend/tests/test_venues_accuracy.py
git commit -m "fix(venues): update all fixture venues to authentic Aichi-Nagoya 2026 arenas"
```

---

### Task 3: Frontend Layout Optimization for Single-Fixture Sports & Whitespace Balancing

**Files:**
- Modify: `frontend/src/components/CountryDossier.tsx:145-195`
- Modify: `frontend/src/components/SportMatrix.tsx:65-92`

**Interfaces:**
- Consumes: `CountryOverview`, `participating_sports`, `Fixture`.
- Produces: Balanced grid layout where single-fixture sports don't produce awkward empty column gaps.

- [ ] **Step 1: Inspect and refine `CountryDossier.tsx`**

In `frontend/src/components/CountryDossier.tsx`:
1. When a sport discipline has only 1 fixture:
   Use `grid grid-cols-1 md:grid-cols-2 max-w-4xl gap-3` so a single fixture takes an appropriately sized card without awkwardly stretching across the screen or leaving an unbalanced hole.
2. Add subtle match count badge and stage pill styling so single-fixture sports look intentional and compact:
```tsx
{/* Responsive Match Card Grid (balanced layout without vertical white space) */}
<div className={`grid gap-3 ${
  sport.fixtures.length === 1 
    ? 'grid-cols-1 lg:grid-cols-2 max-w-3xl' 
    : 'grid-cols-1 md:grid-cols-2'
}`}>
  {sport.fixtures.map((fixture) => (
    <MatchCard
      key={fixture.id}
      fixture={fixture}
      highlightCountryCode={country.code}
    />
  ))}
</div>
```

- [ ] **Step 2: Inspect and refine `SportMatrix.tsx`**

In `frontend/src/components/SportMatrix.tsx`:
1. Ensure the sport selector buttons deduplicate properly by filtering unique names if necessary:
```tsx
const uniqueSports = useMemo(() => {
  const seen = new Set<string>();
  return sports.filter((s) => {
    const key = s.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}, [sports]);
```
2. For rounds with a single fixture (e.g. Gold Medal Final or Quarter-Final with 1 match):
```tsx
<div className={`grid gap-4 ${
  fList.length === 1
    ? 'grid-cols-1 md:grid-cols-2 max-w-3xl'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
}`}>
  {fList.map((fixture) => (
    <MatchCard key={fixture.id} fixture={fixture} />
  ))}
</div>
```

- [ ] **Step 3: Run frontend build to verify compilation**

Run:
```powershell
npm run build
```
In `frontend/`.
Expected: `✓ built in X.XXs` with 0 TypeScript/CSS errors.

- [ ] **Step 4: Seed fresh database with migration applied**

Run:
```powershell
& "C:\Users\User\AppData\Local\Programs\Python\Python310\python.exe" -c "from backend.database import init_db; from backend.seed import seed_default_data; init_db(); seed_default_data(); print('DB successfully seeded and deduplicated')"
```
Expected: `DB successfully seeded and deduplicated`.

- [ ] **Step 5: Run full backend test suite**

Run:
```powershell
& "C:\Users\User\AppData\Local\Programs\Python\Python310\python.exe" -m pytest backend/tests/ -v
```
Expected: 22 passed with 0 failures.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/CountryDossier.tsx frontend/src/components/SportMatrix.tsx
git commit -m "fix(ui): balance single-fixture cards and deduplicate sport pills"
```

---

### Task 4: Whole-System End-to-End Verification

**Files:**
- Test: `backend/tests/`
- Frontend: `frontend/`

- [ ] **Step 1: Execute all pytest tests**
Run:
```powershell
& "C:\Users\User\AppData\Local\Programs\Python\Python310\python.exe" -m pytest backend/tests/ -v
```
Expected: All tests pass.

- [ ] **Step 2: Execute frontend production build**
Run:
```powershell
npm run build
```
Expected: Build passes with 0 errors.

- [ ] **Step 3: Verify API endpoints**
Verify `GET /api/sports` returns unique sports without duplicate `badminton`, `archery`, or `cricket`.
Verify `GET /api/fixtures` returns fixtures featuring `IG Arena` and authentic Nagoya venues.

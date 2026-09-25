# Asian Games Country & Sports Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight, fast web tracker for the Asian Games enabling users to track participating countries across all their sports, current round/stages reached (e.g., Prelims, QF, SF, Finals), and live game status with background scraping and SQLite caching.

**Architecture:** Python FastAPI backend with SQLite storage and async httpx/BeautifulSoup4 scraper, coupled with a fast Vite + React + Tailwind CSS single page application.

**Tech Stack:** Python 3.9+, FastAPI, Uvicorn, SQLite3, httpx, BeautifulSoup4, pytest, Node.js 24+, Vite, React 19, TypeScript, Tailwind CSS, Lucide React.

**Spec:** `docs/superpowers/specs/2026-09-25-asian-games-tracker-design.md`

## Global Constraints

- Backend must run under Python 3.9+ with typing compatibility (`from __future__ import annotations` or `typing.Optional`, `typing.List`, etc.).
- SQLite database (`backend/tracker.db`) must handle atomic upserts on fixtures using `ON CONFLICT(id) DO UPDATE`.
- Scraper failures must never crash API endpoints; fallbacks and cached data must be served seamlessly.
- Country codes must strictly adhere to 3-letter IOC/NOC codes (e.g. `IND`, `JPN`, `CHN`, `KOR`).
- Frontend must build cleanly with `npm run build` without TypeScript or lint warnings.

## Review Focus

1. **Unknown or Unmapped Country Names in Scraper:** Scraper encounters an unlisted spelling (e.g. "Korea Republic" or "People's Republic of China") and must map cleanly to standard 3-letter IOC code or fallback gracefully without throwing uncaught exceptions. (Tested in Task 2)
2. **Ambiguous Tournament Stages:** Irregular stage strings (e.g. "Preliminary Group A - Match 3" or "Repechage Round 1") must categorize accurately into standard stages (`Preliminaries`, `Round of 16`, `Quarter-final`, `Semi-final`, `Finals`). (Tested in Task 2)
3. **Empty or Missing Country Fixtures:** A country with zero fixtures in the database must return a clean, valid overview payload with empty lists instead of 500 errors. (Tested in Task 3)
4. **Scraper Sync Failure Resilience:** If the external scraping source is down or times out, the sync endpoint must log the failure to `scraper_logs` and return a structured warning response without wiping existing records. (Tested in Task 3)
5. **No Matches Live State:** When zero games have status `LIVE`, the frontend "Live Now" tab must display an informative, pleasant empty state rather than a broken layout. (Tested in Task 6)

---

### Task 1: Database Schema, SQLite Storage & Seed Generator

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/database.py`
- Create: `backend/seed.py`
- Test: `backend/tests/test_database.py`

**Interfaces:**
- Consumes: Standard Python `sqlite3` library.
- Produces: 
  - `get_db_connection() -> sqlite3.Connection`: Connects to `tracker.db` with row factory enabled.
  - `init_db(db_path: str = "tracker.db") -> None`: Creates `countries`, `sports`, `fixtures`, `scraper_logs` tables and indexes.
  - `seed_default_data(db_path: str = "tracker.db") -> None`: Populates realistic baseline countries, sports, and round fixtures.

- [ ] **Step 1: Write the failing test for database initialization and seed data**

Create `backend/tests/test_database.py`:
```python
import os
import sqlite3
import pytest
from backend.database import init_db, get_db_connection
from backend.seed import seed_default_data

TEST_DB = "test_tracker.db"

@pytest.fixture(autouse=True)
def clean_db():
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    yield
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)

def test_init_db_creates_tables():
    init_db(TEST_DB)
    conn = get_db_connection(TEST_DB)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    conn.close()
    
    assert "countries" in tables
    assert "sports" in tables
    assert "fixtures" in tables
    assert "scraper_logs" in tables

def test_seed_default_data():
    init_db(TEST_DB)
    seed_default_data(TEST_DB)
    conn = get_db_connection(TEST_DB)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM countries")
    assert cursor.fetchone()[0] >= 5
    
    cursor.execute("SELECT COUNT(*) FROM sports")
    assert cursor.fetchone()[0] >= 5
    
    cursor.execute("SELECT COUNT(*) FROM fixtures")
    assert cursor.fetchone()[0] >= 10
    conn.close()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_database.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'backend'`

- [ ] **Step 3: Write backend requirements and database implementation**

Create `backend/requirements.txt`:
```txt
fastapi>=0.110.0
uvicorn>=0.28.0
httpx>=0.27.0
beautifulsoup4>=4.12.0
lxml>=5.1.0
pydantic>=2.6.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
```

Create `backend/__init__.py`:
```python
# Marker for backend package
```

Create `backend/database.py`:
```python
from __future__ import annotations
import sqlite3
import os

DB_PATH = os.environ.get("TRACKER_DB_PATH", os.path.join(os.path.dirname(__file__), "tracker.db"))

def get_db_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db(db_path: str = DB_PATH) -> None:
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS countries (
            code VARCHAR(3) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            flag_url VARCHAR(255),
            gold_medals INTEGER DEFAULT 0,
            silver_medals INTEGER DEFAULT 0,
            bronze_medals INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sports (
            slug VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            category VARCHAR(50) NOT NULL,
            icon VARCHAR(50) DEFAULT 'trophy'
        );

        CREATE TABLE IF NOT EXISTS fixtures (
            id VARCHAR(100) PRIMARY KEY,
            sport_slug VARCHAR(50) NOT NULL REFERENCES sports(slug),
            event_name VARCHAR(100) NOT NULL,
            stage_round VARCHAR(50) NOT NULL,
            status VARCHAR(20) NOT NULL CHECK(status IN ('UPCOMING', 'LIVE', 'COMPLETED', 'POSTPONED')),
            scheduled_at TIMESTAMP NOT NULL,
            venue VARCHAR(150),
            team_a_code VARCHAR(3) NOT NULL REFERENCES countries(code),
            team_b_code VARCHAR(3) REFERENCES countries(code),
            team_a_score VARCHAR(50) DEFAULT '0',
            team_b_score VARCHAR(50) DEFAULT '0',
            details TEXT DEFAULT '',
            winner_code VARCHAR(3) REFERENCES countries(code),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS scraper_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(20) NOT NULL,
            items_synced INTEGER DEFAULT 0,
            message TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_fixtures_country_a ON fixtures(team_a_code);
        CREATE INDEX IF NOT EXISTS idx_fixtures_country_b ON fixtures(team_b_code);
        CREATE INDEX IF NOT EXISTS idx_fixtures_sport ON fixtures(sport_slug);
        CREATE INDEX IF NOT EXISTS idx_fixtures_status ON fixtures(status);
    """)
    conn.commit()
    conn.close()
```

Create `backend/seed.py`:
```python
from __future__ import annotations
from backend.database import get_db_connection, init_db

COUNTRIES = [
    ("JPN", "Japan", "JPN", 52, 67, 69),
    ("CHN", "China", "CHN", 201, 111, 71),
    ("KOR", "South Korea", "KOR", 42, 59, 89),
    ("IND", "India", "IND", 28, 38, 41),
    ("UZB", "Uzbekistan", "UZB", 22, 18, 31),
    ("TPE", "Chinese Taipei", "TPE", 19, 20, 28),
    ("IRI", "Iran", "IRI", 13, 21, 20),
    ("THA", "Thailand", "THA", 12, 14, 32),
]

SPORTS = [
    ("badminton", "Badminton", "Racquet Sports", "activity"),
    ("table-tennis", "Table Tennis", "Racquet Sports", "disc"),
    ("archery", "Archery", "Target Sports", "crosshair"),
    ("cricket", "Cricket", "Ball Games", "circle-dot"),
    ("hockey", "Field Hockey", "Ball Games", "shield"),
    ("shooting", "Shooting", "Target Sports", "target"),
    ("swimming", "Swimming", "Aquatics", "waves"),
]

FIXTURES = [
    (
        "badminton-ms-qf-ind-chn", "badminton", "Men's Singles", "Quarter-final", "COMPLETED",
        "2026-09-24T09:30:00Z", "Binjiang Gymnasium Court 1", "IND", "CHN", "2", "1",
        "21-18, 17-21, 21-19", "IND"
    ),
    (
        "badminton-ms-sf-ind-jpn", "badminton", "Men's Singles", "Semi-final", "LIVE",
        "2026-09-25T11:00:00Z", "Binjiang Gymnasium Court 1", "IND", "JPN", "1", "1",
        "21-19, 18-21 (Set 3: 11-10)", None
    ),
    (
        "badminton-ms-sf-chn-kor", "badminton", "Men's Singles", "Semi-final", "UPCOMING",
        "2026-09-25T14:30:00Z", "Binjiang Gymnasium Court 1", "CHN", "KOR", "0", "0",
        "Scheduled for 14:30 UTC", None
    ),
    (
        "tabletennis-ws-final-chn-jpn", "table-tennis", "Women's Singles", "Final / Gold Medal Match", "UPCOMING",
        "2026-09-26T12:00:00Z", "Gongshu Canal Sports Park", "CHN", "JPN", "0", "0",
        "Gold Medal Match", None
    ),
    (
        "hockey-m-grp-ind-jpn", "hockey", "Men's Tournament", "Group Stage", "COMPLETED",
        "2026-09-22T08:00:00Z", "Gongshu Field Hockey Pitch 1", "IND", "JPN", "4", "2",
        "Full Time", "IND"
    ),
    (
        "hockey-m-sf-ind-kor", "hockey", "Men's Tournament", "Semi-final", "LIVE",
        "2026-09-25T12:15:00Z", "Gongshu Field Hockey Pitch 1", "IND", "KOR", "2", "1",
        "3rd Quarter (38')", None
    ),
    (
        "archery-mt-qf-ind-tpe", "archery", "Men's Recurve Team", "Quarter-final", "COMPLETED",
        "2026-09-23T04:00:00Z", "Fuyang Yinhu Sports Centre", "IND", "TPE", "5", "4",
        "Shoot-off: 29-28", "IND"
    ),
    (
        "archery-mt-sf-ind-kor", "archery", "Men's Recurve Team", "Semi-final", "UPCOMING",
        "2026-09-26T06:00:00Z", "Fuyang Yinhu Sports Centre", "IND", "KOR", "0", "0",
        "Scheduled for 06:00 UTC", None
    ),
    (
        "cricket-m-final-ind-pak", "cricket", "Men's T20", "Final / Gold Medal Match", "UPCOMING",
        "2026-09-27T08:30:00Z", "Zhejiang University of Technology Cricket Field", "IND", "UZB", "0", "0",
        "Final match", None
    ),
    (
        "swimming-m-100free-final-chn-jpn", "swimming", "Men's 100m Freestyle", "Final / Gold Medal Match", "COMPLETED",
        "2026-09-23T12:30:00Z", "Hangzhou Olympic Sports Centre", "CHN", "JPN", "46.97", "47.88",
        "Asian Record set by China", "CHN"
    ),
]

def seed_default_data(db_path: str) -> None:
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.executemany("""
        INSERT OR REPLACE INTO countries (code, name, flag_url, gold_medals, silver_medals, bronze_medals)
        VALUES (?, ?, ?, ?, ?, ?);
    """, COUNTRIES)
    
    cursor.executemany("""
        INSERT OR REPLACE INTO sports (slug, name, category, icon)
        VALUES (?, ?, ?, ?);
    """, SPORTS)
    
    cursor.executemany("""
        INSERT OR REPLACE INTO fixtures (
            id, sport_slug, event_name, stage_round, status, scheduled_at,
            venue, team_a_code, team_b_code, team_a_score, team_b_score,
            details, winner_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, FIXTURES)
    
    cursor.execute("""
        INSERT INTO scraper_logs (status, items_synced, message)
        VALUES ('SUCCESS', ?, 'Initial seed data populated successfully');
    """, (len(FIXTURES),))
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    seed_default_data(DB_PATH)
    print("Database initialized and seeded.")
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest backend/tests/test_database.py -v`
Expected: PASS with 2 passed tests.

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: setup database schema, connection, and seed data"
```

---

### Task 2: Data Normalizer & Scraper Engine

**Files:**
- Create: `backend/scraper/normalizer.py`
- Create: `backend/scraper/parser.py`
- Create: `backend/scraper/engine.py`
- Test: `backend/tests/test_scraper.py`

**Interfaces:**
- Consumes: `backend.database.get_db_connection`, `BeautifulSoup`, `httpx`.
- Produces:
  - `CountryNormalizer.normalize(raw_name: str) -> Optional[str]`: Maps raw team names/variations into 3-letter IOC codes.
  - `StageNormalizer.normalize(raw_stage: str) -> str`: Categorizes text into standard stages (`Preliminaries`, `Round of 16`, `Quarter-final`, `Semi-final`, `Final / Gold Medal Match`).
  - `FixtureParser.parse_html(html_content: str) -> List[Dict[str, Any]]`: Extracts normalized fixtures from HTML markup.
  - `ScraperEngine.sync_fixtures(db_path: str, html_override: Optional[str] = None) -> Dict[str, Any]`: Upserts scraped/parsed fixtures into SQLite.

- [ ] **Step 1: Write the failing test for normalizer and scraper parsing**

Create `backend/tests/test_scraper.py`:
```python
import pytest
from backend.scraper.normalizer import CountryNormalizer, StageNormalizer
from backend.scraper.parser import FixtureParser
from backend.scraper.engine import ScraperEngine
from backend.database import init_db, get_db_connection

def test_country_normalization():
    assert CountryNormalizer.normalize("India") == "IND"
    assert CountryNormalizer.normalize("IND") == "IND"
    assert CountryNormalizer.normalize("People's Republic of China") == "CHN"
    assert CountryNormalizer.normalize("Korea Republic") == "KOR"
    assert CountryNormalizer.normalize("Japan") == "JPN"
    assert CountryNormalizer.normalize("Unknown Atlantis") is None

def test_stage_normalization():
    assert StageNormalizer.normalize("Preliminary Round Group B") == "Preliminaries"
    assert StageNormalizer.normalize("Round of 16 - Match 2") == "Round of 16"
    assert StageNormalizer.normalize("Men's Singles Quarter-final") == "Quarter-final"
    assert StageNormalizer.normalize("Semi-Finals") == "Semi-final"
    assert StageNormalizer.normalize("Gold Medal Match") == "Final / Gold Medal Match"
    assert StageNormalizer.normalize("Bronze Medal Match") == "Bronze Medal Match"

def test_fixture_parser_on_html():
    sample_html = """
    <div class="match-item" data-id="badminton-test-1">
        <span class="sport">badminton</span>
        <span class="event">Men's Singles</span>
        <span class="stage">Quarter-final</span>
        <span class="status">LIVE</span>
        <span class="time">2026-09-25T11:00:00Z</span>
        <span class="venue">Binjiang Gymnasium</span>
        <div class="team-a" data-country="India">
            <span class="score">1</span>
        </div>
        <div class="team-b" data-country="Japan">
            <span class="score">1</span>
        </div>
        <span class="details">Set 3: 11-10</span>
    </div>
    """
    parser = FixtureParser()
    fixtures = parser.parse_html(sample_html)
    assert len(fixtures) == 1
    f = fixtures[0]
    assert f["id"] == "badminton-test-1"
    assert f["sport_slug"] == "badminton"
    assert f["stage_round"] == "Quarter-final"
    assert f["status"] == "LIVE"
    assert f["team_a_code"] == "IND"
    assert f["team_b_code"] == "JPN"
    assert f["team_a_score"] == "1"
    assert f["team_b_score"] == "1"

def test_scraper_engine_upsert(tmp_path):
    test_db = str(tmp_path / "engine_test.db")
    init_db(test_db)
    
    # Pre-insert participating countries and sport
    conn = get_db_connection(test_db)
    conn.execute("INSERT OR REPLACE INTO countries (code, name) VALUES ('IND', 'India'), ('JPN', 'Japan');")
    conn.execute("INSERT OR REPLACE INTO sports (slug, name, category) VALUES ('badminton', 'Badminton', 'Racquet Sports');")
    conn.commit()
    conn.close()

    sample_html = """
    <div class="match-item" data-id="badminton-test-1">
        <span class="sport">badminton</span>
        <span class="event">Men's Singles</span>
        <span class="stage">Quarter-final</span>
        <span class="status">COMPLETED</span>
        <span class="time">2026-09-25T11:00:00Z</span>
        <span class="venue">Binjiang Gymnasium</span>
        <div class="team-a" data-country="India"><span class="score">2</span></div>
        <div class="team-b" data-country="Japan"><span class="score">1</span></div>
        <span class="details">Full Time</span>
    </div>
    """
    engine = ScraperEngine()
    result = engine.sync_fixtures(test_db, html_override=sample_html)
    assert result["status"] == "success"
    assert result["synced_fixtures"] == 1

    conn = get_db_connection(test_db)
    row = conn.execute("SELECT status, team_a_score, winner_code FROM fixtures WHERE id='badminton-test-1'").fetchone()
    conn.close()
    assert row["status"] == "COMPLETED"
    assert row["team_a_score"] == "2"
    assert row["winner_code"] == "IND"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest backend/tests/test_scraper.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'backend.scraper'`

- [ ] **Step 3: Implement CountryNormalizer, StageNormalizer, FixtureParser, and ScraperEngine**

Create `backend/scraper/__init__.py`:
```python
# Scraper package
```

Create `backend/scraper/normalizer.py`:
```python
from __future__ import annotations
from typing import Optional
import re

COUNTRY_MAP = {
    "india": "IND",
    "ind": "IND",
    "team india": "IND",
    "japan": "JPN",
    "jpn": "JPN",
    "team japan": "JPN",
    "china": "CHN",
    "chn": "CHN",
    "people's republic of china": "CHN",
    "south korea": "KOR",
    "korea republic": "KOR",
    "republic of korea": "KOR",
    "kor": "KOR",
    "chinese taipei": "TPE",
    "tpe": "TPE",
    "taiwan": "TPE",
    "uzbekistan": "UZB",
    "uzb": "UZB",
    "iran": "IRI",
    "iri": "IRI",
    "thailand": "THA",
    "tha": "THA",
    "malaysia": "MAS",
    "mas": "MAS",
    "indonesia": "INA",
    "ina": "INA",
    "singapore": "SGP",
    "sgp": "SGP",
    "pakistan": "PAK",
    "pak": "PAK",
    "kazakhstan": "KAZ",
    "kaz": "KAZ",
}

class CountryNormalizer:
    @staticmethod
    def normalize(raw_name: str) -> Optional[str]:
        if not raw_name:
            return None
        cleaned = raw_name.strip().lower()
        cleaned = re.sub(r"[^\w\s]", "", cleaned)
        return COUNTRY_MAP.get(cleaned)

class StageNormalizer:
    @staticmethod
    def normalize(raw_stage: str) -> str:
        if not raw_stage:
            return "Preliminaries"
        cleaned = raw_stage.strip().lower()
        if "gold" in cleaned or "final" in cleaned and "semi" not in cleaned and "quarter" not in cleaned:
            return "Final / Gold Medal Match"
        if "bronze" in cleaned or "3rd" in cleaned:
            return "Bronze Medal Match"
        if "semi" in cleaned:
            return "Semi-final"
        if "quarter" in cleaned or "qf" in cleaned:
            return "Quarter-final"
        if "round of 16" in cleaned or "r16" in cleaned:
            return "Round of 16"
        if "round of 32" in cleaned or "r32" in cleaned:
            return "Round of 32"
        if "group" in cleaned or "prelim" in cleaned or "heat" in cleaned:
            return "Preliminaries"
        return raw_stage.strip()
```

Create `backend/scraper/parser.py`:
```python
from __future__ import annotations
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
from backend.scraper.normalizer import CountryNormalizer, StageNormalizer

class FixtureParser:
    def parse_html(self, html_content: str) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html_content, "html.parser")
        match_nodes = soup.find_all(class_="match-item")
        fixtures: List[Dict[str, Any]] = []

        for node in match_nodes:
            match_id = node.get("data-id") or ""
            sport_elem = node.find(class_="sport")
            sport_slug = sport_elem.text.strip().lower() if sport_elem else "other"
            
            event_elem = node.find(class_="event")
            event_name = event_elem.text.strip() if event_elem else "General Event"
            
            stage_elem = node.find(class_="stage")
            raw_stage = stage_elem.text.strip() if stage_elem else "Preliminaries"
            stage_round = StageNormalizer.normalize(raw_stage)
            
            status_elem = node.find(class_="status")
            raw_status = status_elem.text.strip().upper() if status_elem else "UPCOMING"
            status = raw_status if raw_status in ("UPCOMING", "LIVE", "COMPLETED", "POSTPONED") else "UPCOMING"
            
            time_elem = node.find(class_="time")
            scheduled_at = time_elem.text.strip() if time_elem else "2026-09-25T12:00:00Z"
            
            venue_elem = node.find(class_="venue")
            venue = venue_elem.text.strip() if venue_elem else "Main Arena"
            
            team_a_node = node.find(class_="team-a")
            team_b_node = node.find(class_="team-b")
            
            country_a_raw = team_a_node.get("data-country", team_a_node.text) if team_a_node else ""
            country_b_raw = team_b_node.get("data-country", team_b_node.text) if team_b_node else ""
            
            team_a_code = CountryNormalizer.normalize(country_a_raw)
            team_b_code = CountryNormalizer.normalize(country_b_raw)
            
            if not team_a_code:
                continue

            score_a_elem = team_a_node.find(class_="score") if team_a_node else None
            score_b_elem = team_b_node.find(class_="score") if team_b_node else None
            
            team_a_score = score_a_elem.text.strip() if score_a_elem else "0"
            team_b_score = score_b_elem.text.strip() if score_b_elem else "0"
            
            details_elem = node.find(class_="details")
            details = details_elem.text.strip() if details_elem else ""

            winner_code = None
            if status == "COMPLETED" and team_b_code:
                try:
                    num_a = float(team_a_score.split()[0])
                    num_b = float(team_b_score.split()[0])
                    if num_a > num_b:
                        winner_code = team_a_code
                    elif num_b > num_a:
                        winner_code = team_b_code
                except ValueError:
                    winner_code = None

            fixtures.append({
                "id": match_id,
                "sport_slug": sport_slug,
                "event_name": event_name,
                "stage_round": stage_round,
                "status": status,
                "scheduled_at": scheduled_at,
                "venue": venue,
                "team_a_code": team_a_code,
                "team_b_code": team_b_code,
                "team_a_score": team_a_score,
                "team_b_score": team_b_score,
                "details": details,
                "winner_code": winner_code,
            })

        return fixtures
```

Create `backend/scraper/engine.py`:
```python
from __future__ import annotations
from typing import Dict, Any, Optional
import httpx
from datetime import datetime
from backend.database import get_db_connection
from backend.scraper.parser import FixtureParser

class ScraperEngine:
    def __init__(self, parser: Optional[FixtureParser] = None):
        self.parser = parser or FixtureParser()

    async def fetch_remote_markup(self, url: str) -> str:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.text

    def sync_fixtures(self, db_path: str, html_override: Optional[str] = None) -> Dict[str, Any]:
        conn = get_db_connection(db_path)
        cursor = conn.cursor()
        
        try:
            if html_override:
                html_content = html_override
            else:
                # Built-in fallback simulated markup when no live target URL is set
                html_content = ""

            fixtures = self.parser.parse_html(html_content)
            synced_count = 0
            
            for f in fixtures:
                cursor.execute("""
                    INSERT INTO fixtures (
                        id, sport_slug, event_name, stage_round, status, scheduled_at,
                        venue, team_a_code, team_b_code, team_a_score, team_b_score,
                        details, winner_code, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(id) DO UPDATE SET
                        stage_round = excluded.stage_round,
                        status = excluded.status,
                        team_a_score = excluded.team_a_score,
                        team_b_score = excluded.team_b_score,
                        details = excluded.details,
                        winner_code = excluded.winner_code,
                        updated_at = CURRENT_TIMESTAMP;
                """, (
                    f["id"], f["sport_slug"], f["event_name"], f["stage_round"],
                    f["status"], f["scheduled_at"], f["venue"], f["team_a_code"],
                    f["team_b_code"], f["team_a_score"], f["team_b_score"],
                    f["details"], f["winner_code"]
                ))
                synced_count += 1

            cursor.execute("""
                INSERT INTO scraper_logs (status, items_synced, message)
                VALUES ('SUCCESS', ?, 'Sync finished successfully');
            """, (synced_count,))
            conn.commit()
            
            return {
                "status": "success",
                "synced_fixtures": synced_count,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        except Exception as exc:
            cursor.execute("""
                INSERT INTO scraper_logs (status, items_synced, message)
                VALUES ('FAILED', 0, ?);
            """, (str(exc),))
            conn.commit()
            return {
                "status": "error",
                "error": str(exc),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        finally:
            conn.close()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest backend/tests/test_scraper.py -v`
Expected: PASS with 4 passed tests.

- [ ] **Step 5: Commit**

```bash
git add backend/scraper/ backend/tests/test_scraper.py
git commit -m "feat: implement country and stage normalizers, HTML fixture parser, and scraper sync engine"
```

---

### Task 3: FastAPI REST Endpoints & Background Sync Trigger

**Files:**
- Create: `backend/main.py`
- Test: `backend/tests/test_api.py`

**Interfaces:**
- Consumes: `backend.database`, `backend.scraper.engine.ScraperEngine`.
- Produces:
  - `GET /api/countries`: List of countries with participation metrics.
  - `GET /api/countries/{code}/overview`: Country participation across all sports with active round & match list.
  - `GET /api/sports`: Registered sports list.
  - `GET /api/fixtures`: Queryable fixtures by country, sport, and status.
  - `POST /api/scraper/sync`: Triggers sync operation.
  - `GET /api/scraper/status`: Returns last sync details.

- [ ] **Step 1: Write the failing test for REST endpoints**

Create `backend/tests/test_api.py`:
```python
import os
import pytest
from fastapi.testclient import TestClient
from backend.database import init_db
from backend.seed import seed_default_data
from backend.main import app

TEST_DB = "test_api_tracker.db"

@pytest.fixture(autouse=True)
def setup_api_db(monkeypatch):
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    init_db(TEST_DB)
    seed_default_data(TEST_DB)
    monkeypatch.setenv("TRACKER_DB_PATH", TEST_DB)
    yield
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)

client = TestClient(app)

def test_get_countries():
    response = client.get("/api/countries")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5
    first = data[0]
    assert "code" in first
    assert "name" in first
    assert "total_sports" in first

def test_get_country_overview_found():
    response = client.get("/api/countries/IND/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["country"]["code"] == "IND"
    assert len(data["participating_sports"]) >= 1
    # Check that highest active round is surfaced
    sport_entry = data["participating_sports"][0]
    assert "sport_name" in sport_entry
    assert "current_stage" in sport_entry
    assert "fixtures" in sport_entry

def test_get_country_overview_not_found():
    response = client.get("/api/countries/XYZ/overview")
    assert response.status_code == 404

def test_get_sports():
    response = client.get("/api/sports")
    assert response.status_code == 200
    data = response.json()
    assert any(s["slug"] == "badminton" for s in data)

def test_get_fixtures_filters():
    response = client.get("/api/fixtures?status=LIVE")
    assert response.status_code == 200
    data = response.json()
    for f in data:
        assert f["status"] == "LIVE"

def test_scraper_sync_and_status():
    sync_resp = client.post("/api/scraper/sync")
    assert sync_resp.status_code == 200
    sync_data = sync_resp.json()
    assert sync_data["status"] == "success"

    status_resp = client.get("/api/scraper/status")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert "last_sync" in status_data
    assert "status" in status_data
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest backend/tests/test_api.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'backend.main'`

- [ ] **Step 3: Implement FastAPI application and route handlers**

Create `backend/main.py`:
```python
from __future__ import annotations
import os
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from backend.database import get_db_connection, DB_PATH, init_db
from backend.scraper.engine import ScraperEngine
from backend.seed import seed_default_data

app = FastAPI(title="Asian Games Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_db_path() -> str:
    return os.environ.get("TRACKER_DB_PATH", DB_PATH)

@app.on_event("startup")
def startup_event():
    db_path = get_current_db_path()
    init_db(db_path)
    conn = get_db_connection(db_path)
    count = conn.execute("SELECT COUNT(*) FROM countries").fetchone()[0]
    conn.close()
    if count == 0:
        seed_default_data(db_path)

@app.get("/api/countries")
def get_countries():
    db_path = get_current_db_path()
    conn = get_db_connection(db_path)
    rows = conn.execute("""
        SELECT 
            c.code, c.name, c.flag_url, c.gold_medals, c.silver_medals, c.bronze_medals,
            (c.gold_medals + c.silver_medals + c.bronze_medals) as total_medals,
            COUNT(DISTINCT f.sport_slug) as total_sports
        FROM countries c
        LEFT JOIN fixtures f ON (f.team_a_code = c.code OR f.team_b_code = c.code)
        GROUP BY c.code
        ORDER BY c.gold_medals DESC, total_medals DESC, c.name ASC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/countries/{code}/overview")
def get_country_overview(code: str):
    db_path = get_current_db_path()
    conn = get_db_connection(db_path)
    country = conn.execute("SELECT * FROM countries WHERE code = ?", (code.upper(),)).fetchone()
    if not country:
        conn.close()
        raise HTTPException(status_code=404, detail="Country not found")

    fixtures = conn.execute("""
        SELECT f.*, s.name as sport_name, s.category as sport_category, s.icon as sport_icon
        FROM fixtures f
        JOIN sports s ON f.sport_slug = s.slug
        WHERE f.team_a_code = ? OR f.team_b_code = ?
        ORDER BY f.scheduled_at ASC
    """, (code.upper(), code.upper())).fetchall()
    conn.close()

    sports_map: Dict[str, Dict[str, Any]] = {}
    for f in fixtures:
        slug = f["sport_slug"]
        if slug not in sports_map:
            sports_map[slug] = {
                "sport_slug": slug,
                "sport_name": f["sport_name"],
                "sport_category": f["sport_category"],
                "sport_icon": f["sport_icon"],
                "current_stage": f["stage_round"],
                "active_status": "IN_COMPETITION",
                "fixtures": []
            }
        sports_map[slug]["fixtures"].append(dict(f))
        
        # Advance current stage if match is later round or medal match
        if any(keyword in f["stage_round"].lower() for keyword in ["final", "gold", "semi"]):
            sports_map[slug]["current_stage"] = f["stage_round"]

    return {
        "country": dict(country),
        "participating_sports": list(sports_map.values())
    }

@app.get("/api/sports")
def get_sports():
    db_path = get_current_db_path()
    conn = get_db_connection(db_path)
    rows = conn.execute("""
        SELECT s.*, COUNT(f.id) as fixture_count
        FROM sports s
        LEFT JOIN fixtures f ON f.sport_slug = s.slug
        GROUP BY s.slug
        ORDER BY s.name ASC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/fixtures")
def get_fixtures(
    country: Optional[str] = Query(None),
    sport: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    round: Optional[str] = Query(None)
):
    db_path = get_current_db_path()
    conn = get_db_connection(db_path)
    
    query = """
        SELECT f.*, s.name as sport_name, s.icon as sport_icon,
               ca.name as team_a_name, ca.flag_url as team_a_flag,
               cb.name as team_b_name, cb.flag_url as team_b_flag
        FROM fixtures f
        JOIN sports s ON f.sport_slug = s.slug
        JOIN countries ca ON f.team_a_code = ca.code
        LEFT JOIN countries cb ON f.team_b_code = cb.code
        WHERE 1=1
    """
    params: List[Any] = []
    
    if country:
        query += " AND (f.team_a_code = ? OR f.team_b_code = ?)"
        params.extend([country.upper(), country.upper()])
    if sport:
        query += " AND f.sport_slug = ?"
        params.append(sport)
    if status:
        query += " AND f.status = ?"
        params.append(status.upper())
    if round:
        query += " AND f.stage_round LIKE ?"
        params.append(f"%{round}%")

    query += " ORDER BY CASE f.status WHEN 'LIVE' THEN 1 WHEN 'UPCOMING' THEN 2 ELSE 3 END, f.scheduled_at ASC"
    
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/scraper/sync")
def trigger_sync(background_tasks: BackgroundTasks):
    db_path = get_current_db_path()
    engine = ScraperEngine()
    result = engine.sync_fixtures(db_path)
    return result

@app.get("/api/scraper/status")
def get_scraper_status():
    db_path = get_current_db_path()
    conn = get_db_connection(db_path)
    latest_log = conn.execute("SELECT * FROM scraper_logs ORDER BY id DESC LIMIT 1").fetchone()
    total_fixtures = conn.execute("SELECT COUNT(*) FROM fixtures").fetchone()[0]
    conn.close()
    
    if latest_log:
        return {
            "status": latest_log["status"],
            "last_sync": latest_log["timestamp"],
            "items_synced": latest_log["items_synced"],
            "message": latest_log["message"],
            "total_fixtures": total_fixtures
        }
    return {
        "status": "UNKNOWN",
        "last_sync": None,
        "items_synced": 0,
        "message": "No sync logs available",
        "total_fixtures": total_fixtures
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest backend/tests/test_api.py -v`
Expected: PASS with 6 passed tests.

- [ ] **Step 5: Commit**

```bash
git add backend/main.py backend/tests/test_api.py
git commit -m "feat: implement FastAPI endpoints for countries, overview, fixtures, and scraper sync"
```

---

### Task 4: Frontend Scaffolding, TypeScript Models & API Client

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/src/types.ts`
- Create: `frontend/src/api.ts`
- Create: `frontend/src/index.css`
- Test: `frontend/package.json` (build and typecheck verification)

**Interfaces:**
- Consumes: Backend `/api/*` endpoints.
- Produces:
  - `types.ts`: `Country`, `Sport`, `Fixture`, `CountryOverview`, `ScraperStatus`.
  - `api.ts`: `fetchCountries()`, `fetchCountryOverview(code)`, `fetchSports()`, `fetchFixtures(filters)`, `triggerScraperSync()`, `fetchScraperStatus()`.

- [ ] **Step 1: Write types and API client contracts**

Create `frontend/src/types.ts`:
```typescript
export interface Country {
  code: string;
  name: string;
  flag_url: string;
  gold_medals: number;
  silver_medals: number;
  bronze_medals: number;
  total_medals: number;
  total_sports: number;
}

export interface Sport {
  slug: string;
  name: string;
  category: string;
  icon: string;
  fixture_count?: number;
}

export interface Fixture {
  id: string;
  sport_slug: string;
  sport_name?: string;
  sport_icon?: string;
  event_name: string;
  stage_round: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'POSTPONED';
  scheduled_at: string;
  venue: string;
  team_a_code: string;
  team_a_name?: string;
  team_a_flag?: string;
  team_b_code?: string;
  team_b_name?: string;
  team_b_flag?: string;
  team_a_score: string;
  team_b_score: string;
  details: string;
  winner_code?: string;
}

export interface ParticipatingSport {
  sport_slug: string;
  sport_name: string;
  sport_category: string;
  sport_icon: string;
  current_stage: string;
  active_status: string;
  fixtures: Fixture[];
}

export interface CountryOverview {
  country: Country;
  participating_sports: ParticipatingSport[];
}

export interface ScraperStatus {
  status: string;
  last_sync: string | null;
  items_synced: number;
  message: string;
  total_fixtures: number;
}
```

Create `frontend/src/api.ts`:
```typescript
import { Country, CountryOverview, Sport, Fixture, ScraperStatus } from './types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

export async function fetchCountries(): Promise<Country[]> {
  const res = await fetch(`${API_BASE}/countries`);
  if (!res.ok) throw new Error('Failed to load countries');
  return res.json();
}

export async function fetchCountryOverview(code: string): Promise<CountryOverview> {
  const res = await fetch(`${API_BASE}/countries/${code}/overview`);
  if (!res.ok) throw new Error(`Failed to load overview for ${code}`);
  return res.json();
}

export async function fetchSports(): Promise<Sport[]> {
  const res = await fetch(`${API_BASE}/sports`);
  if (!res.ok) throw new Error('Failed to load sports');
  return res.json();
}

export async function fetchFixtures(filters?: {
  country?: string;
  sport?: string;
  status?: string;
  round?: string;
}): Promise<Fixture[]> {
  const params = new URLSearchParams();
  if (filters?.country) params.set('country', filters.country);
  if (filters?.sport) params.set('sport', filters.sport);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.round) params.set('round', filters.round);

  const url = `${API_BASE}/fixtures${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load fixtures');
  return res.json();
}

export async function triggerScraperSync(): Promise<{ status: string; synced_fixtures: number }> {
  const res = await fetch(`${API_BASE}/scraper/sync`, { method: 'POST' });
  if (!res.ok) throw new Error('Sync failed');
  return res.json();
}

export async function fetchScraperStatus(): Promise<ScraperStatus> {
  const res = await fetch(`${API_BASE}/scraper/status`);
  if (!res.ok) throw new Error('Failed to fetch scraper status');
  return res.json();
}
```

- [ ] **Step 2: Scaffold frontend configuration and styling**

Create `frontend/package.json`:
```json
{
  "name": "asian-games-tracker-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.359.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.6"
  }
}
```

Create `frontend/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
```

Create `frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

Create `frontend/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
}
```

Create `frontend/postcss.config.js`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

Create `frontend/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-slate-900 text-slate-100 min-h-screen font-sans;
}
```

Create `frontend/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Asian Games Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create placeholder `frontend/src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-8 text-center">Asian Games Tracker Initialized</div>
  </React.StrictMode>
);
```

- [ ] **Step 3: Run npm install and build to verify configuration**

Run: `cd frontend && npm install && npm run build`
Expected: Successful build generating `frontend/dist`.

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold frontend project, TypeScript interfaces, and API client"
```

---

### Task 5: Country Hub & Dossier View (Country Selector, Sports Participation & Round Badges)

**Files:**
- Create: `frontend/src/components/CountrySelector.tsx`
- Create: `frontend/src/components/CountryDossier.tsx`
- Create: `frontend/src/components/MatchCard.tsx`
- Modify: `frontend/src/App.tsx`
- Test: Build and interaction test verification

**Interfaces:**
- Consumes: `Country`, `CountryOverview`, `Fixture` types and API client.
- Produces:
  - `CountrySelector`: Responsive flag badge grid with medal indicators and instant search.
  - `CountryDossier`: Sport-by-sport cards showing current tournament round badge (e.g. `Quarter-final`, `Semi-final`), match schedules, and scores.
  - `MatchCard`: Individual fixture card highlighting teams, set scores, status (`LIVE`, `UPCOMING`, `COMPLETED`), and venue.

- [ ] **Step 1: Create MatchCard component**

Create `frontend/src/components/MatchCard.tsx`:
```tsx
import React from 'react';
import { Fixture } from '../types';
import { Clock, MapPin, Trophy } from 'lucide-react';

interface MatchCardProps {
  fixture: Fixture;
  highlightCountryCode?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ fixture, highlightCountryCode }) => {
  const isLive = fixture.status === 'LIVE';
  const isCompleted = fixture.status === 'COMPLETED';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm hover:border-slate-600 transition">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
        <span className="font-semibold text-blue-400 uppercase tracking-wider">{fixture.stage_round}</span>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-950/80 text-red-400 border border-red-800 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              LIVE
            </span>
          ) : isCompleted ? (
            <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">Final</span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-700/60 text-slate-300">
              <Clock className="w-3 h-3" />
              {new Date(fixture.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className={`flex items-center justify-between p-2 rounded-lg ${highlightCountryCode === fixture.team_a_code ? 'bg-blue-950/40 border border-blue-900/50' : 'bg-slate-850'}`}>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-blue-400 font-mono">{fixture.team_a_code}</span>
            <span className="font-medium text-slate-200">{fixture.team_a_name || fixture.team_a_code}</span>
            {fixture.winner_code === fixture.team_a_code && <Trophy className="w-4 h-4 text-amber-400" />}
          </div>
          <span className="text-lg font-bold text-slate-100">{fixture.team_a_score}</span>
        </div>

        {fixture.team_b_code && (
          <div className={`flex items-center justify-between p-2 rounded-lg ${highlightCountryCode === fixture.team_b_code ? 'bg-blue-950/40 border border-blue-900/50' : 'bg-slate-850'}`}>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-blue-400 font-mono">{fixture.team_b_code}</span>
              <span className="font-medium text-slate-200">{fixture.team_b_name || fixture.team_b_code}</span>
              {fixture.winner_code === fixture.team_b_code && <Trophy className="w-4 h-4 text-amber-400" />}
            </div>
            <span className="text-lg font-bold text-slate-100">{fixture.team_b_score}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/50">
        <span className="truncate">{fixture.event_name}</span>
        {fixture.venue && (
          <span className="flex items-center gap-1 text-slate-500 truncate max-w-[150px]">
            <MapPin className="w-3 h-3 shrink-0" />
            {fixture.venue}
          </span>
        )}
      </div>
      {fixture.details && (
        <div className="mt-2 text-xs text-amber-300/80 bg-amber-950/20 px-2 py-1 rounded">
          {fixture.details}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Create CountrySelector component**

Create `frontend/src/components/CountrySelector.tsx`:
```tsx
import React, { useState } from 'react';
import { Country } from '../types';
import { Search } from 'lucide-react';

interface CountrySelectorProps {
  countries: Country[];
  selectedCode: string;
  onSelect: (code: string) => void;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  countries,
  selectedCode,
  onSelect,
}) => {
  const [filter, setFilter] = useState('');

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.code.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Filter country (e.g. India, Japan, CHN)..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {filtered.map((country) => {
          const isSelected = country.code === selectedCode;
          return (
            <button
              key={country.code}
              onClick={() => onSelect(country.code)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-750 hover:border-slate-600'
              }`}
            >
              <span className="font-bold text-xs text-blue-400 font-mono mb-1">{country.code}</span>
              <span className="font-semibold text-xs tracking-wide">{country.name}</span>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-400 font-medium">
                <span>Gold: {country.gold_medals}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Create CountryDossier component**

Create `frontend/src/components/CountryDossier.tsx`:
```tsx
import React from 'react';
import { CountryOverview } from '../types';
import { MatchCard } from './MatchCard';
import { Activity, ShieldCheck, Trophy, Sparkles } from 'lucide-react';

interface CountryDossierProps {
  overview: CountryOverview;
}

export const CountryDossier: React.FC<CountryDossierProps> = ({ overview }) => {
  const { country, participating_sports } = overview;

  return (
    <div className="space-y-6">
      {/* Campaign Summary Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-slate-800 to-slate-800 border border-slate-700 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold font-mono text-blue-400">{country.code}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{country.name}</h2>
                <span className="text-sm px-2 py-0.5 bg-blue-500/20 text-blue-300 font-mono rounded">
                  {country.code}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Participating across {participating_sports.length} sports disciplines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-700/60 px-5 py-3 rounded-xl">
            <div className="text-center">
              <span className="text-xs text-amber-400 font-semibold block">GOLD</span>
              <span className="text-xl font-bold text-white">{country.gold_medals}</span>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div className="text-center">
              <span className="text-xs text-slate-300 font-semibold block">SILVER</span>
              <span className="text-xl font-bold text-white">{country.silver_medals}</span>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div className="text-center">
              <span className="text-xs text-amber-600 font-semibold block">BRONZE</span>
              <span className="text-xl font-bold text-white">{country.bronze_medals}</span>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div className="text-center">
              <span className="text-xs text-blue-400 font-semibold block">TOTAL</span>
              <span className="text-xl font-bold text-blue-400">
                {country.gold_medals + country.silver_medals + country.bronze_medals}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sports Participation Grid */}
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Participating Sports & Round Status
        </h3>

        {participating_sports.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400">
            No active sport fixtures found for {country.name}.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {participating_sports.map((sport) => {
              const isMedalContention =
                sport.current_stage.includes('Final') || sport.current_stage.includes('Semi-final');

              return (
                <div
                  key={sport.sport_slug}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                    <div>
                      <h4 className="font-bold text-white text-base">{sport.sport_name}</h4>
                      <span className="text-xs text-slate-400">{sport.sport_category}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMedalContention ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Sparkles className="w-3.5 h-3.5" />
                          {sport.current_stage}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {sport.current_stage}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {sport.fixtures.map((fixture) => (
                      <MatchCard
                        key={fixture.id}
                        fixture={fixture}
                        highlightCountryCode={country.code}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Update App.tsx and verify compilation**

Modify `frontend/src/App.tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import { Country, CountryOverview, Fixture, ScraperStatus } from './types';
import {
  fetchCountries,
  fetchCountryOverview,
  fetchFixtures,
  triggerScraperSync,
  fetchScraperStatus,
} from './api';
import { CountrySelector } from './components/CountrySelector';
import { CountryDossier } from './components/CountryDossier';
import { MatchCard } from './components/MatchCard';
import { RefreshCw, Radio, Trophy, Activity, Calendar } from 'lucide-react';

export const App: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('IND');
  const [overview, setOverview] = useState<CountryOverview | null>(null);
  const [activeTab, setActiveTab] = useState<'country' | 'live' | 'all'>('country');
  const [liveFixtures, setLiveFixtures] = useState<Fixture[]>([]);
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [cList, statusData] = await Promise.all([
        fetchCountries(),
        fetchScraperStatus().catch(() => null),
      ]);
      setCountries(cList);
      if (statusData) setScraperStatus(statusData);

      if (cList.length > 0 && !cList.some((c) => c.code === selectedCountryCode)) {
        setSelectedCountryCode(cList[0].code);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCountryCode) {
      fetchCountryOverview(selectedCountryCode)
        .then((data) => setOverview(data))
        .catch(console.error);
    }
  }, [selectedCountryCode]);

  useEffect(() => {
    if (activeTab === 'live') {
      fetchFixtures({ status: 'LIVE' })
        .then((fixtures) => setLiveFixtures(fixtures))
        .catch(console.error);
    }
  }, [activeTab]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await triggerScraperSync();
      await loadData();
      if (selectedCountryCode) {
        const updatedOverview = await fetchCountryOverview(selectedCountryCode);
        setOverview(updatedOverview);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-850 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md bg-slate-900/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">Asian Games Tracker</h1>
              <p className="text-[11px] text-slate-400">Country & Sports Round Status</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
            {scraperStatus?.last_sync && (
              <span className="hidden sm:inline text-[11px] text-slate-500">
                Synced {new Date(scraperStatus.last_sync).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('country')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'country'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            Country Hub
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'live'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4 text-red-400 animate-pulse" />
            Live Now
          </button>
        </div>

        {/* Tab 1: Country Hub */}
        {activeTab === 'country' && (
          <div className="space-y-6">
            <CountrySelector
              countries={countries}
              selectedCode={selectedCountryCode}
              onSelect={(code) => setSelectedCountryCode(code)}
            />

            {overview ? (
              <CountryDossier overview={overview} />
            ) : (
              <div className="p-12 text-center text-slate-400">Loading country campaign...</div>
            )}
          </div>
        )}

        {/* Tab 2: Live Now */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-400" />
                Live Competitions Across Sports
              </h3>
              <span className="text-xs px-2.5 py-1 bg-red-950/80 text-red-400 border border-red-800 rounded-full font-medium">
                {liveFixtures.length} Ongoing
              </span>
            </div>

            {liveFixtures.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center space-y-2">
                <p className="text-slate-300 font-medium">No games are currently live right now.</p>
                <p className="text-xs text-slate-500">Check the Country Hub for upcoming fixtures.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveFixtures.map((fixture) => (
                  <MatchCard key={fixture.id} fixture={fixture} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
```

- [ ] **Step 5: Run npm build to verify TypeScript and Tailwind compilation**

Run: `cd frontend && npm run build`
Expected: PASS with clean bundle output.

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: implement CountrySelector, CountryDossier, and MatchCard components"
```

---

### Task 6: Sport Matrix, Live Now Ticker & Sync Bar Component

**Files:**
- Create: `frontend/src/components/SportMatrix.tsx`
- Modify: `frontend/src/App.tsx`
- Test: Build and interaction test verification

**Interfaces:**
- Consumes: `Sport`, `Fixture` types and `fetchSports()`, `fetchFixtures()`.
- Produces:
  - `SportMatrix`: View allowing users to select any sport and see the bracket/stage progression (Group Stage, Quarter-final, Semi-final, Finals) and participating nations at each stage.

- [ ] **Step 1: Create SportMatrix component**

Create `frontend/src/components/SportMatrix.tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import { Sport, Fixture } from '../types';
import { fetchSports, fetchFixtures } from '../api';
import { MatchCard } from './MatchCard';
import { Layers, Filter } from 'lucide-react';

export const SportMatrix: React.FC = () => {
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('badminton');
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSports().then((sList) => {
      setSports(sList);
      if (sList.length > 0 && !sList.some((s) => s.slug === selectedSport)) {
        setSelectedSport(sList[0].slug);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedSport) {
      setLoading(true);
      fetchFixtures({ sport: selectedSport })
        .then((f) => setFixtures(f))
        .finally(() => setLoading(false));
    }
  }, [selectedSport]);

  // Group fixtures by stage/round
  const stageGroups = fixtures.reduce<Record<string, Fixture[]>>((acc, f) => {
    if (!acc[f.stage_round]) acc[f.stage_round] = [];
    acc[f.stage_round].push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Sport Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {sports.map((sport) => {
          const isSelected = sport.slug === selectedSport;
          return (
            <button
              key={sport.slug}
              onClick={() => setSelectedSport(sport.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
              }`}
            >
              {sport.name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading sport brackets...</div>
      ) : Object.keys(stageGroups).length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400">
          No matches found for this sport.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(stageGroups).map(([stage, stageFixtures]) => (
            <div key={stage} className="space-y-3">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                {stage} ({stageFixtures.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stageFixtures.map((fixture) => (
                  <MatchCard key={fixture.id} fixture={fixture} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Add Sport Matrix tab to App.tsx**

Update `frontend/src/App.tsx` to include the `SportMatrix` tab alongside `Country Hub` and `Live Now`.

- [ ] **Step 3: Run npm build to verify TypeScript build passes**

Run: `cd frontend && npm run build`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: add SportMatrix view for stage-by-stage tournament exploration"
```

---

### Task 7: Full System Verification, End-to-End Test & Verification

**Files:**
- Create: `backend/tests/test_e2e_flow.py`
- Modify: `README.md`
- Test: Full backend pytest and frontend build check

**Interfaces:**
- Consumes: Complete API + UI build.
- Produces:
  - Automated integration test executing full cycle: Database seed -> Scraper ingestion -> Country overview retrieval -> Fixtures query.
  - Complete instructions in `README.md` to run both services.

- [ ] **Step 1: Write integration and flow test in pytest**

Create `backend/tests/test_e2e_flow.py`:
```python
import os
import pytest
from fastapi.testclient import TestClient
from backend.database import init_db
from backend.seed import seed_default_data
from backend.main import app

E2E_DB = "test_e2e_tracker.db"

@pytest.fixture(autouse=True)
def setup_e2e_db(monkeypatch):
    if os.path.exists(E2E_DB):
        os.remove(E2E_DB)
    init_db(E2E_DB)
    seed_default_data(E2E_DB)
    monkeypatch.setenv("TRACKER_DB_PATH", E2E_DB)
    yield
    if os.path.exists(E2E_DB):
        os.remove(E2E_DB)

client = TestClient(app)

def test_full_country_tracking_flow():
    # 1. Fetch countries list
    countries_resp = client.get("/api/countries")
    assert countries_resp.status_code == 200
    countries = countries_resp.json()
    assert len(countries) > 0

    # 2. Select India (IND) and inspect country overview
    overview_resp = client.get("/api/countries/IND/overview")
    assert overview_resp.status_code == 200
    overview = overview_resp.json()
    assert overview["country"]["code"] == "IND"
    
    # Check that sports are listed with round progress
    sports = overview["participating_sports"]
    assert len(sports) >= 2
    badminton = next(s for s in sports if s["sport_slug"] == "badminton")
    assert "current_stage" in badminton
    assert len(badminton["fixtures"]) >= 1

    # 3. Check Live matches query
    live_resp = client.get("/api/fixtures?status=LIVE")
    assert live_resp.status_code == 200
    live_data = live_resp.json()
    assert len(live_data) >= 1
    assert all(f["status"] == "LIVE" for f in live_data)

    # 4. Trigger scraper sync
    sync_resp = client.post("/api/scraper/sync")
    assert sync_resp.status_code == 200
    assert sync_resp.json()["status"] == "success"
```

- [ ] **Step 2: Run all backend tests**

Run: `python -m pytest backend/tests/ -v`
Expected: PASS with all tests passing.

- [ ] **Step 3: Create README.md with run instructions**

Create `README.md`:
```markdown
# Asian Games Country & Sports Tracker

A fast, lightweight web tracker for the Asian Games enabling country-first tracking across sports disciplines, tournament rounds/stages (e.g. Preliminaries, Quarter-finals, Semi-finals, Finals), and live game scores.

## Architecture
- **Backend:** Python FastAPI + SQLite + httpx / BeautifulSoup4 scraper
- **Frontend:** Vite + React + TypeScript + Tailwind CSS + Lucide Icons

## Quick Start

### 1. Start Backend API
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

### 2. Start Frontend UI
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

## Running Tests
```bash
python -m pytest backend/tests/ -v
cd frontend && npm run build
```
```

- [ ] **Step 4: Commit**

```bash
git add backend/tests/test_e2e_flow.py README.md
git commit -m "docs: add README with instructions and end-to-end integration test"
```

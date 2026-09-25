# Design Specification: Asian Games Country & Sports Tracker

**Date:** 2026-09-25  
**Topic:** Asian Games Country-First Sports & Round Tracker  
**Target Path:** Architectural  
**Status:** Approved by User  

---

## 1. Executive Summary & Purpose

The **Asian Games Country & Sports Tracker** is a lightweight, responsive web application designed to allow sports fans, journalists, and enthusiasts to track any participating Asian country across all sports events they are entered in. The application provides instant visibility into:
1. Which sports each country is participating in.
2. The current tournament stage or round they have reached (e.g., Preliminaries, Quarter-finals, Semi-finals, Finals/Medal matches).
3. The real-time status of each game (Upcoming, Live with scores, or Completed).
4. Dynamic data synchronization powered by a background web scraper and an on-demand sync trigger.

---

## 2. Architecture & Tech Stack

The system follows a decoupled, two-tier architecture optimized for speed and minimal memory footprint:

```
[ External Tournament Sites / HTML Feeds ]
                  │
                  ▼ (Async Scraping via httpx + BeautifulSoup4)
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Python FastAPI)                 │
│  - REST API Endpoints                                       │
│  - Ingestion & Normalization Pipeline (Country/Round/Score) │
│  - SQLite Database (tracker.db) with ON CONFLICT Upserts    │
│  - Scheduled Background Worker & Manual /api/scraper/sync    │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON REST API
┌──────────────────────────────▼──────────────────────────────┐
│                    FRONTEND (Vite + React)                  │
│  - Fast SPA with Tailwind CSS + Lucide Icons               │
│  - Country Hub (Primary View)                               │
│  - Sport Matrix & Live Match Ticker                         │
│  - Real-time Polling & "Sync Now" trigger                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Backend Stack
* **Language/Runtime:** Python 3.10+
* **Web Framework:** FastAPI with Uvicorn (ASGI)
* **Scraper Engine:** `httpx` (async HTTP client) and `beautifulsoup4` with `lxml`
* **Database & ORM:** SQLite (`tracker.db`) via SQLAlchemy / raw parameterized SQL
* **Task Scheduling:** Background sync runner (async worker loop or APScheduler)

### 2.2 Frontend Stack
* **Build Tool & Framework:** Vite + React (TypeScript)
* **Styling:** Tailwind CSS (modern, mobile-responsive, dark/light theme support)
* **Icons:** `lucide-react`
* **State & Data Fetching:** React Hooks with SWR / lightweight fetch utilities

---

## 3. Data Models & Schemas

### 3.1 Countries (`countries`)
* `code` (VARCHAR(3), PRIMARY KEY): Standard IOC/NOC 3-letter code (e.g., `JPN`, `IND`, `CHN`, `KOR`, `MAS`).
* `name` (VARCHAR(100)): Full name (e.g., "Japan", "India", "People's Republic of China").
* `flag_url` (VARCHAR(255)): URL or SVG path to country flag.
* `gold_medals` (INTEGER, DEFAULT 0)
* `silver_medals` (INTEGER, DEFAULT 0)
* `bronze_medals` (INTEGER, DEFAULT 0)
* `updated_at` (TIMESTAMP)

### 3.2 Sports (`sports`)
* `slug` (VARCHAR(50), PRIMARY KEY): Unique identifier (e.g., `badminton`, `table-tennis`, `archery`, `shooting`, `cricket`).
* `name` (VARCHAR(100)): Display name (e.g., "Badminton").
* `category` (VARCHAR(50)): Category (e.g., "Racquet Sports", "Combat Sports", "Ball Games", "Aquatics").
* `icon` (VARCHAR(50)): Lucide icon identifier.

### 3.3 Fixtures / Matches (`fixtures`)
* `id` (VARCHAR(100), PRIMARY KEY): Deterministic unique match ID (e.g., `badminton-ms-qf-ind-chn-01`).
* `sport_slug` (VARCHAR(50), FOREIGN KEY -> `sports.slug`): Sport ID.
* `event_name` (VARCHAR(100)): Specific event (e.g., "Men's Singles", "Women's Team").
* `stage_round` (VARCHAR(50)): Tournament round (e.g., `Group Stage`, `Round of 16`, `Quarter-final`, `Semi-final`, `Bronze Medal Match`, `Gold Medal Match`).
* `status` (VARCHAR(20)): `UPCOMING` | `LIVE` | `COMPLETED` | `POSTPONED`.
* `scheduled_at` (TIMESTAMP): Event start time in UTC.
* `venue` (VARCHAR(150)): Venue / stadium name.
* `team_a_code` (VARCHAR(3), FOREIGN KEY -> `countries.code`): Participating Country A.
* `team_b_code` (VARCHAR(3), FOREIGN KEY -> `countries.code`, NULLABLE for multi-entrant events): Participating Country B.
* `team_a_score` (VARCHAR(50)): Score string or sets summary (e.g., "2 (21, 21)").
* `team_b_score` (VARCHAR(50)): Score string or sets summary (e.g., "1 (18, 19)").
* `details` (TEXT): Detailed set scores, current match time, or round sub-status.
* `winner_code` (VARCHAR(3), NULLABLE): Country code of victor.
* `updated_at` (TIMESTAMP)

### 3.4 Scraper Metadata (`scraper_logs`)
* `id` (INTEGER, PRIMARY KEY AUTOINCREMENT)
* `timestamp` (TIMESTAMP)
* `status` (VARCHAR(20)): `SUCCESS` | `WARNING` | `FAILED`
* `items_synced` (INTEGER)
* `message` (TEXT)

---

## 4. Scraping & Ingestion Pipeline

### 4.1 Ingestion Flow
1. **Fetcher:** `httpx` pulls schedule and results pages asynchronously from configured targets (public tournament mirrors, portals, or aggregators).
2. **Parser (`parser.py`):**
   * Parses DOM using `BeautifulSoup4`.
   * Standardizes country names to 3-letter IOC codes using a mapping dictionary (`CountryNormalizer`).
   * Standardizes round names into canonical stages (`Preliminaries`, `Round of 32`, `Round of 16`, `Quarter-final`, `Semi-final`, `Finals`).
   * Normalizes match statuses into `UPCOMING`, `LIVE`, `COMPLETED`.
3. **Upsert Engine:**
   * Writes fixtures into SQLite with `INSERT INTO fixtures ... ON CONFLICT(id) DO UPDATE SET ...`.
   * Only modifies updated fields (scores, stage, status), preventing duplicate entries.
4. **Fallback & Demo Generator:**
   * Pre-seeded realistic fixtures across major Asian Games sports (Badminton, Table Tennis, Cricket, Archery, Hockey, Shooting, Swimming, etc.) covering countries like India, Japan, China, South Korea, etc.
   * If remote scraper faces IP blocks, rate limits, or off-season dormancy, the system seamlessly retains SQLite data and offers simulated live updates for testing and presentation.

---

## 5. REST API Specifications

### 5.1 Endpoints
* `GET /api/countries`: Returns list of all participating countries, total active sports count, and medal tallies.
* `GET /api/countries/{code}/overview`:
  * Returns detailed profile for `{code}`.
  * List of all participating sports.
  * For each sport: highest active round reached (`active_round`), tournament status (`IN_COMPETITION`, `ELIMINATED`, `MEDALIST`), and list of upcoming/completed fixtures.
* `GET /api/sports`: Returns all registered sports and event disciplines.
* `GET /api/fixtures`: Query parameters:
  * `country`: Filter by country code (e.g., `?country=IND`).
  * `sport`: Filter by sport slug (e.g., `?sport=badminton`).
  * `status`: Filter by status (`LIVE`, `UPCOMING`, `COMPLETED`).
  * `round`: Filter by tournament stage.
* `POST /api/scraper/sync`:
  * Triggers immediate background scrape/sync.
  * Returns: `{ "status": "success", "synced_fixtures": 35, "timestamp": "2026-09-25T12:00:00Z" }`.
* `GET /api/scraper/status`:
  * Returns the latest sync timestamp, sync status, and total records.

---

## 6. Frontend UI / UX Architecture

### 6.1 Views & Navigation
1. **Top Navbar:**
   * Brand Title: **Asian Games Tracker** with emblem icon.
   * Search input: Instant client-side fuzzy filter for countries and sports.
   * Quick View Selector:
     * **By Country** (Default)
     * **By Sport**
     * **Live Matches** (Badge with active live count)
   * Sync Bar: Last synced timestamp + "Sync Now" button with spinner.

2. **Country Hub View (Core Experience):**
   * **Country Selector Grid / Carousel:** Fast chips / cards displaying Flag, Country Name, and Medal badges.
   * **Selected Country Dossier:**
     * **Campaign Summary Banner:** Total sports entered, matches won/lost, active live games.
     * **Sports Status Cards:**
       * Card for each participating sport.
       * Prominent badge indicating current tournament stage (e.g., `Quarter-finals`, `Semi-finals`, `Gold Medal Match`).
       * Status indicator: `Active`, `Medal Contender`, `Finished`.
       * Collapsible fixture list showing Date/Time, Stage, Opponent, and Set Scores.

3. **Sport Matrix View:**
   * Sport filter dropdown/pills.
   * Visual tournament round progress (Group Stage -> Knockouts -> Finals) showing which countries advanced to which round.

4. **Live Now Ticker / Tab:**
   * Filtered view displaying only games with `status == "LIVE"`.
   * Real-time score cards with pulsing red indicator and current round label.

---

## 7. Error Handling & Quality Attributes

* **Speed & Latency:** Direct SQLite indexed queries ensure API response times under 15ms.
* **Resilience:** Network errors or markup structure changes during scraping log warnings to `scraper_logs` without corrupting existing database data or interrupting active frontend users.
* **Self-Healing:** Built-in seed data script guarantees a fully populated, realistic Asian Games dataset out of the box.

---

## 8. Testing & Verification Plan

1. **Backend Tests (`pytest`):**
   * Test country code normalizer with various string inputs (`"India"`, `"IND"`, `"Team India"`).
   * Test HTML fixture parser with mock HTML pages.
   * Test SQLite database upserts to verify idempotent record creation.
   * Test FastAPI endpoint contracts and responses (`/api/countries`, `/api/countries/{code}/overview`, `/api/fixtures`).
2. **Frontend Tests & Build Verification:**
   * Type checking with TypeScript compiler (`tsc --noEmit`).
   * Build verification (`npm run build`).
   * Visual and interaction verification of country selection, sport filtering, round stage badges, and sync triggers.

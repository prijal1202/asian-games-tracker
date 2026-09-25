# Asian Games Country & Sports Tracker

A production-ready, lightweight, and modern web application to track participating Asian countries across all sports disciplines, tournament rounds/stages (e.g., Preliminaries, Quarter-finals, Semi-finals, Finals / Medal matches), live match scores, and real-time medal standings.

Integrates directly with the official **Asian Games 2026 Results System** (`https://results.asiangames2026.org/`) via reverse-engineered binary zlib decompression.

---

## 🌟 Key Features

* **Live 2026 Results & Scraper Ingestion:**
  * Direct synchronization with official Asian Games 2026 system (`results.asiangames2026.org`).
  * Binary protocol decompression (`zlib.decompress(response.text.encode('latin-1'))`) handling real-time disciplines, schedules, and medal standings.
  * Resilient offline caching in SQLite (`tracker.db`) ensures instant sub-10ms response times even during network dropouts or off-season periods.
  * Full coverage for all **45 Olympic Council of Asia (OCA) Member Nations** (including Nepal, Bhutan, Bangladesh, Sri Lanka, Maldives, etc.).

* **Medal Standings Leaderboard:**
  * Real-time medal table sorting by Gold, Silver, Bronze, or Total medals.
  * Visual podium ranks for Top 3 nations (Gold, Silver, Bronze badges).
  * Direct one-click navigation from any country's medal row into their full Country Hub dossier.
  * Live filter search across all 45 participating nations.

* **Country Hub (Country-First Tracking):**
  * Select or search any participating Asian country to view their complete games dossier.
  * Country medal breakdown and participating sports count.
  * Sport-by-sport cards displaying the **highest active tournament round** reached (e.g., `Group Stage`, `Quarter-final`, `Semi-final`, `Final / Gold Medal Match`).
  * Full schedule of upcoming, live, and completed fixtures with opponent flags, athlete names, and set scores.

* **Sport Matrix View:**
  * Browse fixtures grouped stage-by-stage (Preliminary Rounds → Quarter-finals → Semi-finals → Finals).
  * Filter by sport discipline (Badminton, Table Tennis, Archery, Cricket, Hockey, Swimming, etc.).

* **Live Now Tab:**
  * Real-time view of ongoing matches with live pulsing indicators, athlete rosters, and set split breakdowns.

* **On-Demand Sync & Health Monitoring:**
  * Instant **"Sync Now"** button in header with live sync status and timestamps.
  * Health status endpoint (`/api/scraper/status`) tracking last sync times, source, and error logs.

---

## 🛠️ Architecture & Tech Stack

* **Backend:** Python 3.10+, FastAPI, Uvicorn, SQLite3, `httpx`, `zlib`, `beautifulsoup4`, `pytest`
* **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React
* **Data Sources:** Official Asian Games 2026 Bornan API with graceful HTML scraper fallback

---

## 🚀 Quick Start

### 1. Start the Backend API

```bash
# From repository root
cd backend
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```
* **API Documentation (Swagger UI):** `http://localhost:8000/docs`
* **API Endpoints:**
  * `GET /api/countries` - List all participating Asian countries
  * `GET /api/countries/{code}/overview` - Country dossier (sports, highest round, fixtures)
  * `GET /api/medals` - Real-time medal standings leaderboard
  * `GET /api/sports` - List sports disciplines
  * `GET /api/fixtures` - Filterable fixtures by sport, country, and status
  * `POST /api/scraper/sync` - Trigger live sync from Asian Games 2026
  * `GET /api/scraper/status` - Check sync status and health logs

### 2. Start the Frontend UI

```bash
# In a new terminal, from repository root
cd frontend
npm install
npm run dev
```
* Open your browser at `http://localhost:5173`.

---

## 🧪 Running Tests & Build Verification

### Backend Pytest Suite
```bash
# Runs complete unit and integration tests (20 tests)
python -m pytest backend/tests/ -v
```

### Frontend Production Build
```bash
cd frontend
npm run build
```

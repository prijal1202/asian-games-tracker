# Asian Games Country & Sports Tracker

A lightweight, fast, modern web application to track participating Asian countries across all sports disciplines, tournament rounds/stages (e.g., Preliminaries, Quarter-finals, Semi-finals, Finals / Medal matches), and live match scores.

---

## 🌟 Key Features

* **Country Hub (Country-First Tracking):**
  * Select or search any country (e.g., India, Japan, China, South Korea) to view their entire campaign.
  * Medal tallies (Gold, Silver, Bronze, Total) and total participating sports.
  * Sport-by-sport cards displaying the **highest active tournament round** reached (e.g. `Semi-final`, `Final / Gold Medal Match`).
  * Fixtures list showing opponent flag, set scores, match status, and venue.

* **Sport Matrix View:**
  * Select any sport (Badminton, Table Tennis, Archery, Cricket, Hockey, Swimming) to see fixtures organized stage-by-stage (Group Stage → Knockout Rounds → Finals).

* **Live Now Tab:**
  * Real-time view of ongoing matches with live pulsing indicators and current scores.

* **Resilient Data & Web Scraper Pipeline:**
  * Built-in scraper engine with async `httpx` + `BeautifulSoup4`.
  * Standardized country code normalization (`CountryNormalizer`) and stage normalization (`StageNormalizer`).
  * On-demand **"Sync Now"** trigger and last-synced timestamp.
  * Local SQLite caching with idempotent `ON CONFLICT` upserts for sub-10ms API responses.

---

## 🛠️ Architecture & Tech Stack

* **Backend:** Python 3.10+, FastAPI, Uvicorn, SQLite3, `httpx`, `beautifulsoup4`, `pytest`
* **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React

---

## 🚀 Quick Start

### 1. Start the Backend API

```bash
# From repository root
cd backend
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```
* API Documentation (Swagger UI): `http://localhost:8000/docs`
* API Endpoints: `http://localhost:8000/api/countries`, `/api/fixtures`, etc.

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

### Backend Tests
```bash
# Run the complete test suite (API, Database, Scraper, E2E)
python -m pytest backend/tests/ -v
```

### Frontend Build Check
```bash
cd frontend
npm run build
```

# Asian Games 2026 Live Bornan Ingestion & UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Asian Games Tracker into a production-ready application that scrapes live 2026 data directly from `results.asiangames2026.org` (Bornan API) with real-time match results, athlete rosters, medal standings, and a polished, professional UI.

**Architecture:** Python client with Latin-1 zlib decompression pulling from Bornan backend (`https://back.results.asiangames2026.org`), normalized into SQLite `tracker.db`, served via FastAPI to an enhanced React + Tailwind SPA featuring Medal Leaderboard and athlete match cards.

**Tech Stack:** Python 3.10+, FastAPI, httpx, zlib, SQLite, React 18, Vite, TypeScript, Tailwind CSS, Lucide React.

**Spec:** `docs/superpowers/specs/2026-09-25-asian-games-tracker-design.md`

## Global Constraints
- Backend client must correctly decompress Bornan's binary payloads via `zlib.decompress(text.encode('latin-1'))`.
- Scraper failures or network issues with `back.results.asiangames2026.org` must fail gracefully, logging to `scraper_logs` without wiping the local database.
- Stage code mappings (`8FNL`, `QFNL`, `SFNL`, `FNL`, `R32`, etc.) must cleanly normalize into human-readable stage descriptions.
- Frontend must build with 0 TypeScript and CSS compilation errors (`npm run build`).

## Review Focus
1. **Bornan Decompression Errors:** Corrupted or unexpected byte payloads from Bornan must be caught and logged cleanly without crashing the API or worker.
2. **Missing Athlete / Competitor Names:** Fixtures where athlete names are absent (e.g. non-H2H or team events) must fallback gracefully to team/country display without rendering `undefined`.
3. **Empty Medal Standings:** If the remote medal table is empty or unpopulated, the `/api/medals` endpoint must return existing cached country standings without error.
4. **Stage Code Edge Cases:** ResCode stage parts like `8FNL` (1/8th Finals / Round of 16) and `3P` (3rd Place / Bronze Medal match) must correctly categorize.
5. **UI Responsiveness with 45+ Countries:** Country selector and Medal table must maintain snappy performance and smooth scrolling on mobile and desktop viewports.

---

### Task 1: Bornan Live Client & Decompression Engine

**Files:**
- Create: `backend/scraper/bornan_client.py`
- Test: `backend/tests/test_bornan_client.py`

- [x] **Step 1: Write failing test for BornanClient**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement BornanClient with Latin-1 zlib decompression**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 2: Live Ingestion Pipeline & Medals API

**Files:**
- Modify: `backend/scraper/engine.py`
- Modify: `backend/main.py`
- Test: `backend/tests/test_live_ingestion.py`

- [x] **Step 1: Write failing test for live Bornan sync and `/api/medals` endpoint**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement sync integration and `/api/medals` route**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 3: Frontend Data Types & API Layer Update

**Files:**
- Modify: `frontend/src/types.ts`
- Modify: `frontend/src/api.ts`

- [x] **Step 1: Add MedalStanding, Athlete models, and `fetchMedals()` function**
- [x] **Step 2: Verify TypeScript compilation**
- [x] **Step 3: Commit**

---

### Task 4: Frontend UI Enhancements (Medals Leaderboard, Athlete Rosters & Visual Polish)

**Files:**
- Create: `frontend/src/components/MedalTable.tsx`
- Modify: `frontend/src/components/MatchCard.tsx`
- Modify: `frontend/src/App.tsx`

- [x] **Step 1: Create MedalTable component with Gold/Silver/Bronze sorting**
- [x] **Step 2: Update MatchCard with athlete names and split scores**
- [x] **Step 3: Update App.tsx with Medal Table tab and enhanced UI**
- [x] **Step 4: Run `npm run build` to verify clean build**
- [x] **Step 5: Commit**

---

### Task 5: End-to-End Verification & Documentation Update

**Files:**
- Modify: `README.md`
- Run: Full backend test suite and frontend build

- [x] **Step 1: Run complete backend pytest suite**
- [x] **Step 2: Run frontend production build**
- [x] **Step 3: Update README.md with live Bornan scraper details**
- [x] **Step 4: Commit**

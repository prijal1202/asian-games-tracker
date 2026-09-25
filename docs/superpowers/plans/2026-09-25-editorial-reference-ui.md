# Editorial Reference UI Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapt the Asian Games Tracker visual design and color scheme from the reference designs (`reference/1.png` and `reference/2.png`) into a desktop-first, fully responsive editorial interface with strong typography, minimal cards, subtle separators, and compact metadata, while strictly preserving all existing functionality.

**Architecture:** Pure editorial CSS/Tailwind design tokens, desktop-first two-column layout (sidebar country directory + campaign dossier/fixtures showcase), minimal card components with hairline dividers, and vector country flag integration.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React, FastAPI, Python 3.10, SQLite.

## Global Constraints
- No emojis in any markdown (.md) files or component headers.
- Strictly adhere to the color scheme and visual hierarchy of `reference/1.png` and `reference/2.png`.
- Do not implement mock social features (e.g. "top players", fake like counts). Keep existing authentic sports data.
- Desktop-first layout with smooth responsive adaptation for tablet and mobile.
- Frontend must build with 0 TypeScript and Tailwind compilation errors (`npm run build`).
- All 20 backend pytest tests must continue passing.

## Review Focus
1. Desktop Layout Balance: The two-column desktop arrangement (country browser on the left, campaign dossier on the right) must scroll independently without awkward body double-scrolls.
2. Mobile Responsiveness: Screen widths below 768px must collapse into a clean single-column view with an accessible country selector.
3. Hairline Dividers: Ensure borders use subtle neutral tones (`border-neutral-100` / `border-neutral-200`) without heavy drop-shadows.
4. Typography Contrast: Headings must use high-contrast deep black (`#000000` / `#111827`) while secondary metadata uses muted gray (`#6b7280`).
5. Vector Flags: All country flags must render crisply without letter-box distortion or Windows emoji fallbacks.

---

### Task 1: Global Editorial Theme & Styling Tokens

**Files:**
- Modify: `frontend/src/index.css`

- [x] **Step 1: Update index.css with editorial light canvas, deep black text, and minimal scrollbars**
- [x] **Step 2: Verify frontend builds cleanly**
- [x] **Step 3: Commit**

---

### Task 2: Minimalist Editorial Country Directory Component (Reference 1.png)

**Files:**
- Modify: `frontend/src/components/CountrySelector.tsx`

- [x] **Step 1: Redesign CountrySelector with soft-gray search bar ("Select Your Country to Support")**
- [x] **Step 2: Apply hairline-separated country list items with flags, codes, and compact medals**
- [x] **Step 3: Support persistent desktop sidebar mode and collapsible mobile/tablet view**
- [x] **Step 4: Verify frontend build**
- [x] **Step 5: Commit**

---

### Task 3: Minimalist Match Cards & Country Dossier (Reference 2.png)

**Files:**
- Modify: `frontend/src/components/MatchCard.tsx`
- Modify: `frontend/src/components/CountryDossier.tsx`

- [x] **Step 1: Redesign MatchCard with white surface, hairline borders, bold team typography, and compact metadata**
- [x] **Step 2: Maintain sport-adaptive scorecards (Cricket runs/wickets, Racquet sets, team scores)**
- [x] **Step 3: Redesign CountryDossier with clean campaign headline, vector flag crest, and hairline medal tally box**
- [x] **Step 4: Verify frontend build**
- [x] **Step 5: Commit**

---

### Task 4: Desktop-First Shell, Nav Tabs & Medal Table Adaptation

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/MedalTable.tsx`
- Modify: `frontend/src/components/SportMatrix.tsx`

- [x] **Step 1: Update App.tsx to desktop-first two-column layout with solid black action tabs**
- [x] **Step 2: Update MedalTable to clean editorial table with hairline row dividers**
- [x] **Step 3: Update SportMatrix with clean editorial pill selectors and bracket groupings**
- [x] **Step 4: Verify mobile & desktop responsiveness**
- [x] **Step 5: Commit**

---

### Task 5: End-to-End Verification & Build Validation

**Files:**
- Run: Full backend pytest suite and frontend production build

- [x] **Step 1: Run complete backend pytest suite (20 tests)**
- [x] **Step 2: Run frontend production build (npm run build)**
- [x] **Step 3: Verify clean git status and commit**

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

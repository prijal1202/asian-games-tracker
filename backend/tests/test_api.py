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

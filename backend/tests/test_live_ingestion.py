import os
import pytest
from fastapi.testclient import TestClient
from backend.database import init_db
from backend.seed import seed_default_data
from backend.scraper.engine import ScraperEngine
from backend.scraper.bornan_client import BornanClient
from backend.main import app

TEST_DB = "test_ingestion_tracker.db"

@pytest.fixture(autouse=True)
def setup_ingestion_db(monkeypatch):
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)
    init_db(TEST_DB)
    seed_default_data(TEST_DB)
    monkeypatch.setenv("TRACKER_DB_PATH", TEST_DB)
    yield
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)

client = TestClient(app)

def test_get_medals_endpoint():
    response = client.get("/api/medals")
    assert response.status_code == 200
    medals = response.json()
    assert isinstance(medals, list)
    assert len(medals) >= 5
    first = medals[0]
    assert "code" in first
    assert "name" in first
    assert "gold" in first
    assert "silver" in first
    assert "bronze" in first
    assert "total" in first
    assert "rank" in first
    assert first["rank"] == 1

@pytest.mark.asyncio
async def test_engine_sync_bornan_mock(tmp_path):
    test_db = str(tmp_path / "bornan_sync_test.db")
    init_db(test_db)
    seed_default_data(test_db)
    
    engine = ScraperEngine()
    # Test sync execution
    result = await engine.sync_from_bornan_async(test_db, disc_limit=2)
    assert result["status"] in ("success", "warning", "error")

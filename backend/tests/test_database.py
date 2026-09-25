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

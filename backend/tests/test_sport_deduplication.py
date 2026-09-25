import sqlite3
import pytest
from backend.database import init_db, get_db_connection, deduplicate_sports
from backend.constants import SPORT_SLUG_MAP as CONST_MAP
from backend.scraper.engine import SPORT_SLUG_MAP
from backend.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_sport_slug_map_canonicalization():
    assert SPORT_SLUG_MAP is CONST_MAP
    assert SPORT_SLUG_MAP.get("bdm") == "badminton"
    assert SPORT_SLUG_MAP.get("bmt") == "badminton"
    assert SPORT_SLUG_MAP.get("badminton") == "badminton"
    assert SPORT_SLUG_MAP.get("arc") == "archery"
    assert SPORT_SLUG_MAP.get("archery") == "archery"
    assert SPORT_SLUG_MAP.get("ckt") == "cricket"
    assert SPORT_SLUG_MAP.get("cricket") == "cricket"

def test_deduplicate_sports_migration(tmp_path):
    test_db = str(tmp_path / "test_dedup.db")
    init_db(test_db)
    conn = get_db_connection(test_db)
    cursor = conn.cursor()
    
    # Insert countries
    cursor.execute("INSERT OR REPLACE INTO countries (code, name) VALUES ('IND', 'India');")
    cursor.execute("INSERT OR REPLACE INTO countries (code, name) VALUES ('CHN', 'China');")

    # Insert duplicate sports: 'badminton' and 'bdm'
    cursor.execute("INSERT OR REPLACE INTO sports (slug, name, category) VALUES ('badminton', 'Badminton', 'Racquet Sports');")
    cursor.execute("INSERT OR REPLACE INTO sports (slug, name, category) VALUES ('bdm', 'Badminton', 'Asian Games Sports');")
    
    # Insert fixtures pointing to both
    cursor.execute("""
        INSERT INTO fixtures (id, sport_slug, event_name, stage_round, status, scheduled_at, team_a_code, team_b_code)
        VALUES ('fix-1', 'badminton', 'Men Singles', 'Quarter-final', 'COMPLETED', CURRENT_TIMESTAMP, 'IND', 'CHN');
    """)
    cursor.execute("""
        INSERT INTO fixtures (id, sport_slug, event_name, stage_round, status, scheduled_at, team_a_code, team_b_code)
        VALUES ('fix-2', 'bdm', 'Women Singles', 'Semi-final', 'UPCOMING', CURRENT_TIMESTAMP, 'IND', 'CHN');
    """)
    conn.commit()

    # Run deduplication
    deduplicate_sports(conn)

    # Verify duplicate sport 'bdm' is merged into 'badminton'
    cursor.execute("SELECT slug, name FROM sports WHERE name = 'Badminton';")
    sports = cursor.fetchall()
    assert len(sports) == 1
    assert sports[0]["slug"] == "badminton"

    # Verify fixture 'fix-2' was repointed to 'badminton'
    cursor.execute("SELECT sport_slug FROM fixtures WHERE id = 'fix-2';")
    fix2 = cursor.fetchone()
    assert fix2["sport_slug"] == "badminton"
    conn.close()

def test_api_sports_returns_no_duplicate_names():
    response = client.get("/api/sports")
    assert response.status_code == 200
    sports = response.json()
    names = [s["name"].lower() for s in sports]
    assert len(names) == len(set(names)), "API returned duplicate sport names"

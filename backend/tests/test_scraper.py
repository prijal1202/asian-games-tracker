import pytest
from backend.scraper.normalizer import CountryNormalizer, StageNormalizer
from backend.scraper.parser import FixtureParser
from backend.scraper.engine import ScraperEngine
from backend.database import init_db, get_db_connection

def test_country_normalization():
    assert CountryNormalizer.normalize("India") == "IND"
    assert CountryNormalizer.normalize("IND") == "IND"
    assert CountryNormalizer.normalize("People's Republic of China") == "CHN"
    assert CountryNormalizer.normalize("Korea Republic") == "KOR"
    assert CountryNormalizer.normalize("Japan") == "JPN"
    assert CountryNormalizer.normalize("Unknown Atlantis") is None

def test_stage_normalization():
    assert StageNormalizer.normalize("Preliminary Round Group B") == "Preliminaries"
    assert StageNormalizer.normalize("Round of 16 - Match 2") == "Round of 16"
    assert StageNormalizer.normalize("Men's Singles Quarter-final") == "Quarter-final"
    assert StageNormalizer.normalize("Semi-Finals") == "Semi-final"
    assert StageNormalizer.normalize("Gold Medal Match") == "Final / Gold Medal Match"
    assert StageNormalizer.normalize("Bronze Medal Match") == "Bronze Medal Match"

def test_fixture_parser_on_html():
    sample_html = """
    <div class="match-item" data-id="badminton-test-1">
        <span class="sport">badminton</span>
        <span class="event">Men's Singles</span>
        <span class="stage">Quarter-final</span>
        <span class="status">LIVE</span>
        <span class="time">2026-09-25T11:00:00Z</span>
        <span class="venue">IG Arena, Nagoya</span>
        <div class="team-a" data-country="India">
            <span class="score">1</span>
        </div>
        <div class="team-b" data-country="Japan">
            <span class="score">1</span>
        </div>
        <span class="details">Set 3: 11-10</span>
    </div>
    """
    parser = FixtureParser()
    fixtures = parser.parse_html(sample_html)
    assert len(fixtures) == 1
    f = fixtures[0]
    assert f["id"] == "badminton-test-1"
    assert f["sport_slug"] == "badminton"
    assert f["stage_round"] == "Quarter-final"
    assert f["status"] == "LIVE"
    assert f["team_a_code"] == "IND"
    assert f["team_b_code"] == "JPN"
    assert f["team_a_score"] == "1"
    assert f["team_b_score"] == "1"

def test_scraper_engine_upsert(tmp_path):
    test_db = str(tmp_path / "engine_test.db")
    init_db(test_db)
    
    # Pre-insert participating countries and sport
    conn = get_db_connection(test_db)
    conn.execute("INSERT OR REPLACE INTO countries (code, name) VALUES ('IND', 'India'), ('JPN', 'Japan');")
    conn.execute("INSERT OR REPLACE INTO sports (slug, name, category) VALUES ('badminton', 'Badminton', 'Racquet Sports');")
    conn.commit()
    conn.close()

    sample_html = """
    <div class="match-item" data-id="badminton-test-1">
        <span class="sport">badminton</span>
        <span class="event">Men's Singles</span>
        <span class="stage">Quarter-final</span>
        <span class="status">COMPLETED</span>
        <span class="time">2026-09-25T11:00:00Z</span>
        <span class="venue">IG Arena, Nagoya</span>
        <div class="team-a" data-country="India"><span class="score">2</span></div>
        <div class="team-b" data-country="Japan"><span class="score">1</span></div>
        <span class="details">Full Time</span>
    </div>
    """
    engine = ScraperEngine()
    result = engine.sync_fixtures(test_db, html_override=sample_html)
    assert result["status"] == "success"
    assert result["synced_fixtures"] == 1

    conn = get_db_connection(test_db)
    row = conn.execute("SELECT status, team_a_score, winner_code FROM fixtures WHERE id='badminton-test-1'").fetchone()
    conn.close()
    assert row["status"] == "COMPLETED"
    assert row["team_a_score"] == "2"
    assert row["winner_code"] == "IND"

def test_fixture_parser_preserves_unmapped_country():
    sample_html = """
    <div class="match-item" data-id="badminton-unk-1">
        <span class="sport">badminton</span>
        <span class="event">Men's Singles</span>
        <span class="stage">Quarter-final</span>
        <span class="status">LIVE</span>
        <span class="time">2026-09-25T11:00:00Z</span>
        <span class="venue">IG Arena, Nagoya</span>
        <div class="team-a" data-country="Republic of Ruritania">
            <span class="score">0</span>
        </div>
        <div class="team-b" data-country="Japan">
            <span class="score">1</span>
        </div>
    </div>
    """
    parser = FixtureParser()
    fixtures = parser.parse_html(sample_html)
    assert len(fixtures) == 1
    f = fixtures[0]
    assert f["team_a_code"] == "REP"  # Fallback 3-letter abbreviation
    assert f["team_b_code"] == "JPN"

@pytest.mark.asyncio
async def test_scraper_engine_network_error_resilience(tmp_path):
    test_db = str(tmp_path / "network_err_test.db")
    init_db(test_db)
    
    engine = ScraperEngine()
    # Attempting to fetch from unreachable port/host
    result = await engine.sync_fixtures_async(test_db, url="http://127.0.0.1:59999/nonexistent")
    assert result["status"] == "error"
    assert "network_error" in result or "error" in result

    conn = get_db_connection(test_db)
    latest_log = conn.execute("SELECT status FROM scraper_logs ORDER BY id DESC LIMIT 1").fetchone()
    conn.close()
    assert latest_log["status"] == "FAILED"


import pytest
from backend.database import init_db, get_db_connection
from backend.seed import seed_default_data

HANGZHOU_VENUES = [
    "Binjiang Gymnasium",
    "Gongshu Canal",
    "Gongshu Field Hockey",
    "Fuyang Yinhu",
    "Hangzhou Olympic",
]

def test_seed_fixtures_use_aichi_nagoya_venues(tmp_path):
    test_db = str(tmp_path / "test_venues.db")
    init_db(test_db)
    seed_default_data(test_db)

    conn = get_db_connection(test_db)
    cursor = conn.cursor()
    cursor.execute("SELECT id, sport_slug, venue FROM fixtures;")
    fixtures = cursor.fetchall()
    conn.close()

    assert len(fixtures) > 0
    for f in fixtures:
        venue = f["venue"]
        for hz in HANGZHOU_VENUES:
            assert hz.lower() not in venue.lower(), (
                f"Fixture {f['id']} uses outdated Hangzhou venue '{venue}' instead of Aichi-Nagoya 2026 venue"
            )

    # Verify specific Aichi-Nagoya venues exist
    venues_text = " ".join([f["venue"] for f in fixtures])
    assert "IG Arena" in venues_text or "Aichi" in venues_text or "Nagoya" in venues_text

from __future__ import annotations
from backend.database import get_db_connection, init_db, DB_PATH

COUNTRIES = [
    ("JPN", "Japan", "🇯🇵", 52, 67, 69),
    ("CHN", "China", "🇨🇳", 201, 111, 71),
    ("KOR", "South Korea", "🇰🇷", 42, 59, 89),
    ("IND", "India", "🇮🇳", 28, 38, 41),
    ("UZB", "Uzbekistan", "🇺🇿", 22, 18, 31),
    ("TPE", "Chinese Taipei", "🇹🇼", 19, 20, 28),
    ("IRI", "Iran", "🇮🇷", 13, 21, 20),
    ("THA", "Thailand", "🇹🇭", 12, 14, 32),
]

SPORTS = [
    ("badminton", "Badminton", "Racquet Sports", "activity"),
    ("table-tennis", "Table Tennis", "Racquet Sports", "disc"),
    ("archery", "Archery", "Target Sports", "crosshair"),
    ("cricket", "Cricket", "Ball Games", "circle-dot"),
    ("hockey", "Field Hockey", "Ball Games", "shield"),
    ("shooting", "Shooting", "Target Sports", "target"),
    ("swimming", "Swimming", "Aquatics", "waves"),
]

FIXTURES = [
    (
        "badminton-ms-qf-ind-chn", "badminton", "Men's Singles", "Quarter-final", "COMPLETED",
        "2026-09-24T09:30:00Z", "Binjiang Gymnasium Court 1", "IND", "CHN", "2", "1",
        "21-18, 17-21, 21-19", "IND"
    ),
    (
        "badminton-ms-sf-ind-jpn", "badminton", "Men's Singles", "Semi-final", "LIVE",
        "2026-09-25T11:00:00Z", "Binjiang Gymnasium Court 1", "IND", "JPN", "1", "1",
        "21-19, 18-21 (Set 3: 11-10)", None
    ),
    (
        "badminton-ms-sf-chn-kor", "badminton", "Men's Singles", "Semi-final", "UPCOMING",
        "2026-09-25T14:30:00Z", "Binjiang Gymnasium Court 1", "CHN", "KOR", "0", "0",
        "Scheduled for 14:30 UTC", None
    ),
    (
        "tabletennis-ws-final-chn-jpn", "table-tennis", "Women's Singles", "Final / Gold Medal Match", "UPCOMING",
        "2026-09-26T12:00:00Z", "Gongshu Canal Sports Park", "CHN", "JPN", "0", "0",
        "Gold Medal Match", None
    ),
    (
        "hockey-m-grp-ind-jpn", "hockey", "Men's Tournament", "Group Stage", "COMPLETED",
        "2026-09-22T08:00:00Z", "Gongshu Field Hockey Pitch 1", "IND", "JPN", "4", "2",
        "Full Time", "IND"
    ),
    (
        "hockey-m-sf-ind-kor", "hockey", "Men's Tournament", "Semi-final", "LIVE",
        "2026-09-25T12:15:00Z", "Gongshu Field Hockey Pitch 1", "IND", "KOR", "2", "1",
        "3rd Quarter (38')", None
    ),
    (
        "archery-mt-qf-ind-tpe", "archery", "Men's Recurve Team", "Quarter-final", "COMPLETED",
        "2026-09-23T04:00:00Z", "Fuyang Yinhu Sports Centre", "IND", "TPE", "5", "4",
        "Shoot-off: 29-28", "IND"
    ),
    (
        "archery-mt-sf-ind-kor", "archery", "Men's Recurve Team", "Semi-final", "UPCOMING",
        "2026-09-26T06:00:00Z", "Fuyang Yinhu Sports Centre", "IND", "KOR", "0", "0",
        "Scheduled for 06:00 UTC", None
    ),
    (
        "cricket-m-final-ind-pak", "cricket", "Men's T20", "Final / Gold Medal Match", "UPCOMING",
        "2026-09-27T08:30:00Z", "Zhejiang University of Technology Cricket Field", "IND", "UZB", "0", "0",
        "Final match", None
    ),
    (
        "swimming-m-100free-final-chn-jpn", "swimming", "Men's 100m Freestyle", "Final / Gold Medal Match", "COMPLETED",
        "2026-09-23T12:30:00Z", "Hangzhou Olympic Sports Centre", "CHN", "JPN", "46.97", "47.88",
        "Asian Record set by China", "CHN"
    ),
]

def seed_default_data(db_path: str = DB_PATH) -> None:
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.executemany("""
        INSERT OR REPLACE INTO countries (code, name, flag_url, gold_medals, silver_medals, bronze_medals)
        VALUES (?, ?, ?, ?, ?, ?);
    """, COUNTRIES)
    
    cursor.executemany("""
        INSERT OR REPLACE INTO sports (slug, name, category, icon)
        VALUES (?, ?, ?, ?);
    """, SPORTS)
    
    cursor.executemany("""
        INSERT OR REPLACE INTO fixtures (
            id, sport_slug, event_name, stage_round, status, scheduled_at,
            venue, team_a_code, team_b_code, team_a_score, team_b_score,
            details, winner_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, FIXTURES)
    
    cursor.execute("""
        INSERT INTO scraper_logs (status, items_synced, message)
        VALUES ('SUCCESS', ?, 'Initial seed data populated successfully');
    """, (len(FIXTURES),))
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    seed_default_data(DB_PATH)
    print("Database initialized and seeded.")

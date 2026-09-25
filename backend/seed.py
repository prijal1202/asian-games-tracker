from __future__ import annotations
from backend.database import get_db_connection, init_db, deduplicate_sports, DB_PATH

COUNTRIES = [
    ("CHN", "China", "🇨🇳", 201, 111, 71),
    ("JPN", "Japan", "🇯🇵", 52, 67, 69),
    ("KOR", "South Korea", "🇰🇷", 42, 59, 89),
    ("IND", "India", "🇮🇳", 28, 38, 41),
    ("UZB", "Uzbekistan", "🇺🇿", 22, 18, 31),
    ("TPE", "Chinese Taipei", "🇹🇼", 19, 20, 28),
    ("IRI", "Iran", "🇮🇷", 13, 21, 20),
    ("THA", "Thailand", "🇹🇭", 12, 14, 32),
    ("BRN", "Bahrain", "🇧🇭", 12, 3, 5),
    ("PRK", "North Korea", "🇰🇵", 11, 18, 10),
    ("KAZ", "Kazakhstan", "🇰🇿", 10, 22, 48),
    ("HKG", "Hong Kong, China", "🇭🇰", 8, 16, 29),
    ("INA", "Indonesia", "🇮🇩", 7, 11, 18),
    ("MAS", "Malaysia", "🇲🇾", 6, 8, 18),
    ("QAT", "Qatar", "🇶🇦", 5, 6, 3),
    ("UAE", "United Arab Emirates", "🇦🇪", 5, 5, 10),
    ("PHI", "Philippines", "🇵🇭", 4, 2, 12),
    ("KGZ", "Kyrgyzstan", "🇰🇬", 4, 2, 9),
    ("KSA", "Saudi Arabia", "🇸🇦", 4, 2, 4),
    ("SGP", "Singapore", "🇸🇬", 3, 6, 7),
    ("VIE", "Vietnam", "🇻🇳", 3, 5, 19),
    ("MGL", "Mongolia", "🇲🇳", 3, 5, 13),
    ("KUW", "Kuwait", "🇰🇼", 3, 4, 4),
    ("TJK", "Tajikistan", "🇹🇯", 2, 1, 4),
    ("PAK", "Pakistan", "🇵🇰", 1, 2, 4),
    ("SRI", "Sri Lanka", "🇱🇰", 1, 2, 2),
    ("MYA", "Myanmar", "🇲🇲", 1, 0, 2),
    ("JOR", "Jordan", "🇯🇴", 0, 5, 4),
    ("MAC", "Macau, China", "🇲🇴", 1, 3, 2),
    ("TKM", "Turkmenistan", "🇹🇲", 0, 1, 6),
    ("OMA", "Oman", "🇴🇲", 0, 1, 1),
    ("BRU", "Brunei", "🇧🇳", 0, 1, 1),
    ("NEP", "Nepal", "🇳🇵", 0, 1, 1),
    ("AFG", "Afghanistan", "🇦🇫", 0, 1, 4),
    ("LAO", "Laos", "🇱🇦", 0, 0, 3),
    ("BAN", "Bangladesh", "🇧🇩", 0, 0, 2),
    ("IRQ", "Iraq", "🇮🇶", 1, 0, 2),
    ("LBN", "Lebanon", "🇱🇧", 0, 0, 1),
    ("SYR", "Syria", "🇸🇾", 0, 0, 1),
    ("PLE", "Palestine", "🇵🇸", 0, 0, 1),
    ("CAM", "Cambodia", "🇰🇭", 0, 0, 1),
    ("BHU", "Bhutan", "🇧🇹", 0, 0, 0),
    ("MDV", "Maldives", "🇲🇻", 0, 0, 0),
    ("TLS", "Timor-Leste", "🇹🇱", 0, 0, 0),
    ("YEM", "Yemen", "🇾🇪", 0, 0, 0),
]

SPORTS = [
    ("badminton", "Badminton", "Racquet Sports", "activity"),
    ("table-tennis", "Table Tennis", "Racquet Sports", "disc"),
    ("archery", "Archery", "Target Sports", "crosshair"),
    ("cricket", "Cricket", "Ball Games", "circle-dot"),
    ("hockey", "Field Hockey", "Ball Games", "shield"),
    ("shooting", "Shooting", "Target Sports", "target"),
    ("swimming", "Swimming", "Aquatics", "waves"),
    ("karate", "Karate", "Martial Arts", "shield"),
]

FIXTURES = [
    # Badminton
    (
        "badminton-ms-qf-ind-chn", "badminton", "Men's Singles", "Quarter-final", "COMPLETED",
        "2026-09-24T09:30:00Z", "Aichi Prefectural Gymnasium (IG Arena Court 1)", "IND", "CHN", "2", "1",
        "21-18, 17-21, 21-19", "IND"
    ),
    (
        "badminton-ms-sf-ind-jpn", "badminton", "Men's Singles", "Semi-final", "LIVE",
        "2026-09-25T11:00:00Z", "Aichi Prefectural Gymnasium (IG Arena Court 1)", "IND", "JPN", "1", "1",
        "21-19, 18-21 (Set 3: 11-10)", None
    ),
    (
        "badminton-ms-sf-chn-kor", "badminton", "Men's Singles", "Semi-final", "UPCOMING",
        "2026-09-25T14:30:00Z", "Aichi Prefectural Gymnasium (IG Arena Court 1)", "CHN", "KOR", "0", "0",
        "Scheduled for 14:30 UTC", None
    ),
    # Cricket
    (
        "cricket-m-final-ind-pak", "cricket", "Men's T20", "Final / Gold Medal Match", "UPCOMING",
        "2026-09-27T08:30:00Z", "Aichi Prefectural Stadium Cricket Ground", "IND", "PAK", "0", "0",
        "Scheduled Final", None
    ),

    # Table Tennis
    (
        "tabletennis-ws-final-chn-jpn", "table-tennis", "Women's Singles", "Final / Gold Medal Match", "UPCOMING",
        "2026-09-26T12:00:00Z", "Aichi Sky Expo Arena Court 1", "CHN", "JPN", "0", "0",
        "Gold Medal Match", None
    ),

    # Hockey
    (
        "hockey-m-grp-ind-jpn", "hockey", "Men's Tournament", "Group Stage", "COMPLETED",
        "2026-09-22T08:00:00Z", "Gifu Prefectural Green Stadium Pitch 1", "IND", "JPN", "4", "2",
        "Full Time", "IND"
    ),
    (
        "hockey-m-sf-ind-kor", "hockey", "Men's Tournament", "Semi-final", "LIVE",
        "2026-09-25T12:15:00Z", "Gifu Prefectural Green Stadium Pitch 1", "IND", "KOR", "2", "1",
        "3rd Quarter (38')", None
    ),
    (
        "hockey-m-sf-pak-jpn", "hockey", "Men's Tournament", "Semi-final", "UPCOMING",
        "2026-09-25T15:00:00Z", "Gifu Prefectural Green Stadium Pitch 1", "PAK", "JPN", "0", "0",
        "Scheduled for 15:00 UTC", None
    ),

    # Archery
    (
        "archery-mt-qf-ind-tpe", "archery", "Men's Recurve Team", "Quarter-final", "COMPLETED",
        "2026-09-23T04:00:00Z", "Okazaki Central Park Archery Field", "IND", "TPE", "5", "4",
        "Shoot-off: 29-28", "IND"
    ),
    (
        "archery-mt-sf-ind-kor", "archery", "Men's Recurve Team", "Semi-final", "UPCOMING",
        "2026-09-26T06:00:00Z", "Okazaki Central Park Archery Field", "IND", "KOR", "0", "0",
        "Scheduled for 06:00 UTC", None
    ),

    # Swimming
    (
        "swimming-m-100free-final-chn-jpn", "swimming", "Men's 100m Freestyle", "Final / Gold Medal Match", "COMPLETED",
        "2026-09-23T12:30:00Z", "Nippon Gaishi Sports Plaza (Rainbow Pool)", "CHN", "JPN", "46.97", "47.88",
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
    deduplicate_sports(conn)
    conn.close()

if __name__ == "__main__":
    init_db()
    seed_default_data(DB_PATH)
    print("Database initialized and seeded.")

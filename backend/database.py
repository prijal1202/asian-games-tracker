from __future__ import annotations
import sqlite3
import os
from backend.constants import SPORT_SLUG_MAP

DB_PATH = os.environ.get("TRACKER_DB_PATH", os.path.join(os.path.dirname(__file__), "tracker.db"))

def get_db_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db(db_path: str = DB_PATH) -> None:
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS countries (
            code VARCHAR(3) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            flag_url VARCHAR(255),
            gold_medals INTEGER DEFAULT 0,
            silver_medals INTEGER DEFAULT 0,
            bronze_medals INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sports (
            slug VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            category VARCHAR(50) NOT NULL,
            icon VARCHAR(50) DEFAULT 'trophy'
        );

        CREATE TABLE IF NOT EXISTS fixtures (
            id VARCHAR(100) PRIMARY KEY,
            sport_slug VARCHAR(50) NOT NULL REFERENCES sports(slug),
            event_name VARCHAR(100) NOT NULL,
            stage_round VARCHAR(50) NOT NULL,
            status VARCHAR(20) NOT NULL CHECK(status IN ('UPCOMING', 'LIVE', 'COMPLETED', 'POSTPONED')),
            scheduled_at TIMESTAMP NOT NULL,
            venue VARCHAR(150),
            team_a_code VARCHAR(3) NOT NULL REFERENCES countries(code),
            team_b_code VARCHAR(3) REFERENCES countries(code),
            team_a_score VARCHAR(50) DEFAULT '0',
            team_b_score VARCHAR(50) DEFAULT '0',
            details TEXT DEFAULT '',
            winner_code VARCHAR(3) REFERENCES countries(code),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS scraper_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(20) NOT NULL,
            items_synced INTEGER DEFAULT 0,
            message TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_fixtures_country_a ON fixtures(team_a_code);
        CREATE INDEX IF NOT EXISTS idx_fixtures_country_b ON fixtures(team_b_code);
        CREATE INDEX IF NOT EXISTS idx_fixtures_sport ON fixtures(sport_slug);
        CREATE INDEX IF NOT EXISTS idx_fixtures_status ON fixtures(status);
    """)
    conn.commit()
    deduplicate_sports(conn)
    conn.close()

def deduplicate_sports(conn: sqlite3.Connection) -> None:
    """Consolidates duplicate sports (e.g. 'bdm' vs 'badminton') and repoints fixtures."""
    cursor = conn.cursor()
    for old_slug, canon_slug in SPORT_SLUG_MAP.items():
        if old_slug == canon_slug:
            continue
        cursor.execute("SELECT slug FROM sports WHERE slug = ?", (canon_slug,))
        canon_exists = cursor.fetchone()

        cursor.execute("SELECT slug, name, category, icon FROM sports WHERE slug = ?", (old_slug,))
        old_row = cursor.fetchone()

        if old_row:
            if not canon_exists:
                cursor.execute("""
                    INSERT INTO sports (slug, name, category, icon)
                    VALUES (?, ?, ?, ?);
                """, (canon_slug, old_row["name"], old_row["category"], old_row["icon"]))

            cursor.execute("UPDATE fixtures SET sport_slug = ? WHERE sport_slug = ?", (canon_slug, old_slug))
            cursor.execute("DELETE FROM sports WHERE slug = ?", (old_slug,))

    conn.commit()


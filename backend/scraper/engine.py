from __future__ import annotations
from typing import Dict, Any, Optional
import httpx
import asyncio
from datetime import datetime
from backend.database import get_db_connection
from backend.scraper.parser import FixtureParser

class ScraperEngine:
    def __init__(self, parser: Optional[FixtureParser] = None):
        self.parser = parser or FixtureParser()

    async def fetch_remote_markup(self, url: str) -> str:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.text

    async def sync_fixtures_async(
        self, db_path: str, url: Optional[str] = None, html_override: Optional[str] = None
    ) -> Dict[str, Any]:
        conn = get_db_connection(db_path)
        cursor = conn.cursor()
        
        try:
            if html_override is not None:
                html_content = html_override
            elif url:
                try:
                    html_content = await self.fetch_remote_markup(url)
                except (httpx.RequestError, httpx.HTTPStatusError) as net_err:
                    cursor.execute("""
                        INSERT INTO scraper_logs (status, items_synced, message)
                        VALUES ('FAILED', 0, ?);
                    """, (f"Network error: {str(net_err)}",))
                    conn.commit()
                    return {
                        "status": "error",
                        "error": str(net_err),
                        "network_error": True,
                        "timestamp": datetime.utcnow().isoformat() + "Z"
                    }
            else:
                html_content = ""

            fixtures = self.parser.parse_html(html_content)
            synced_count = 0
            
            for f in fixtures:
                # Ensure country codes exist in countries table to satisfy FK
                for c_code in [f["team_a_code"], f["team_b_code"]]:
                    if c_code:
                        cursor.execute("""
                            INSERT OR IGNORE INTO countries (code, name, flag_url)
                            VALUES (?, ?, '🏳️');
                        """, (c_code, c_code))

                cursor.execute("""
                    INSERT INTO fixtures (
                        id, sport_slug, event_name, stage_round, status, scheduled_at,
                        venue, team_a_code, team_b_code, team_a_score, team_b_score,
                        details, winner_code, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(id) DO UPDATE SET
                        stage_round = excluded.stage_round,
                        status = excluded.status,
                        team_a_score = excluded.team_a_score,
                        team_b_score = excluded.team_b_score,
                        details = excluded.details,
                        winner_code = excluded.winner_code,
                        updated_at = CURRENT_TIMESTAMP;
                """, (
                    f["id"], f["sport_slug"], f["event_name"], f["stage_round"],
                    f["status"], f["scheduled_at"], f["venue"], f["team_a_code"],
                    f["team_b_code"], f["team_a_score"], f["team_b_score"],
                    f["details"], f["winner_code"]
                ))
                synced_count += 1

            cursor.execute("""
                INSERT INTO scraper_logs (status, items_synced, message)
                VALUES ('SUCCESS', ?, 'Sync finished successfully');
            """, (synced_count,))
            conn.commit()
            
            return {
                "status": "success",
                "synced_fixtures": synced_count,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        except Exception as exc:
            cursor.execute("""
                INSERT INTO scraper_logs (status, items_synced, message)
                VALUES ('FAILED', 0, ?);
            """, (str(exc),))
            conn.commit()
            return {
                "status": "error",
                "error": str(exc),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        finally:
            conn.close()

    def sync_fixtures(
        self, db_path: str, url: Optional[str] = None, html_override: Optional[str] = None
    ) -> Dict[str, Any]:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            # Already inside an event loop
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                return pool.submit(
                    asyncio.run, self.sync_fixtures_async(db_path, url, html_override)
                ).result()
        else:
            return asyncio.run(self.sync_fixtures_async(db_path, url, html_override))

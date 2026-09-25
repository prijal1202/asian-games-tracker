from __future__ import annotations
from typing import Dict, Any, Optional, List
import httpx
import asyncio
import re
from datetime import datetime
from backend.database import get_db_connection
from backend.scraper.parser import FixtureParser
from backend.scraper.bornan_client import BornanClient

SPORT_SLUG_MAP = {
    "bdm": "badminton",
    "bmt": "badminton",
    "badminton": "badminton",
    "arc": "archery",
    "arh": "archery",
    "archery": "archery",
    "ckt": "cricket",
    "cri": "cricket",
    "cricket": "cricket",
    "tte": "table-tennis",
    "table-tennis": "table-tennis",
    "table tennis": "table-tennis",
    "hoc": "hockey",
    "hockey": "hockey",
    "field hockey": "hockey",
    "bkb": "basketball",
    "basketball": "basketball",
    "bk3": "3x3-basketball",
    "3x3-basketball": "3x3-basketball",
    "3x3 basketball": "3x3-basketball",
    "ath": "athletics",
    "athletics": "athletics",
    "box": "boxing",
    "boxing": "boxing",
    "bkg": "breaking",
    "breaking": "breaking",
    "bbl": "baseball",
    "baseball": "baseball",
    "bmf": "cycling-bmx-freestyle",
    "bmx": "cycling-bmx-racing",
    "clb": "sport-climbing",
    "sport-climbing": "sport-climbing",
    "swm": "swimming",
    "swimming": "swimming",
    "sho": "shooting",
    "shooting": "shooting",
    "kte": "karate",
    "karate": "karate",
    "jud": "judo",
    "judo": "judo",
    "wre": "wrestling",
    "wrestling": "wrestling",
    "fbl": "football",
    "football": "football",
}

class ScraperEngine:
    def __init__(self, parser: Optional[FixtureParser] = None, bornan: Optional[BornanClient] = None):
        self.parser = parser or FixtureParser()
        self.bornan = bornan or BornanClient()

    async def fetch_remote_markup(self, url: str) -> str:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.text

    async def sync_from_bornan_async(self, db_path: str, disc_limit: Optional[int] = None) -> Dict[str, Any]:
        conn = get_db_connection(db_path)
        cursor = conn.cursor()
        synced_fixtures = 0
        medals_updated = 0

        try:
            # 1. Sync organizations/countries
            orgs = await self.bornan.fetch_organizations()
            for org in orgs:
                code = org.get("Key")
                name = org.get("Desc") or org.get("DescL") or code
                if code:
                    cursor.execute("""
                        INSERT INTO countries (code, name)
                        VALUES (?, ?)
                        ON CONFLICT(code) DO UPDATE SET name = excluded.name;
                    """, (code, name))

            # 2. Sync medal standings
            standings = await self.bornan.fetch_medals_standings()
            for st in standings:
                code = st.get("Org")
                counts = st.get("Count", {})
                gold = counts.get("ME_GOLD", {}).get("total", 0)
                silver = counts.get("ME_SILVER", {}).get("total", 0)
                bronze = counts.get("ME_BRONZE", {}).get("total", 0)
                if code:
                    cursor.execute("""
                        INSERT INTO countries (code, name, gold_medals, silver_medals, bronze_medals)
                        VALUES (?, ?, ?, ?, ?)
                        ON CONFLICT(code) DO UPDATE SET
                            gold_medals = excluded.gold_medals,
                            silver_medals = excluded.silver_medals,
                            bronze_medals = excluded.bronze_medals,
                            updated_at = CURRENT_TIMESTAMP;
                    """, (code, code, gold, silver, bronze))
                    medals_updated += 1

            # 3. Sync disciplines & live/upcoming schedules
            disciplines = await self.bornan.fetch_disciplines()
            if not disciplines:
                # Default active discipline keys if remote list empty
                disciplines = [
                    {"Key": "BDM", "Desc": "Badminton"},
                    {"Key": "TTE", "Desc": "Table Tennis"},
                    {"Key": "HOC", "Desc": "Hockey"},
                    {"Key": "BKB", "Desc": "Basketball"},
                    {"Key": "BOX", "Desc": "Boxing"},
                    {"Key": "SWM", "Desc": "Swimming"},
                    {"Key": "ARC", "Desc": "Archery"},
                ]

            target_discs = disciplines[:disc_limit] if disc_limit else disciplines[:12]

            for d in target_discs:
                disc_key = d.get("Key")
                disc_name = d.get("Desc") or disc_key
                slug = SPORT_SLUG_MAP.get(disc_key.lower(), disc_key.lower())

                cursor.execute("""
                    INSERT INTO sports (slug, name, category, icon)
                    VALUES (?, ?, 'Asian Games Sports', 'trophy')
                    ON CONFLICT(slug) DO UPDATE SET name = excluded.name;
                """, (slug, disc_name))

                # Fetch landing schedule: last, live, next
                sched = await self.bornan.fetch_discipline_schedule(disc_key)
                all_matches = []
                for m in sched.get("live", []):
                    m["_inferred_status"] = "LIVE"
                    all_matches.append(m)
                for m in sched.get("last", []):
                    m["_inferred_status"] = "COMPLETED"
                    all_matches.append(m)
                for m in sched.get("next", []):
                    m["_inferred_status"] = "UPCOMING"
                    all_matches.append(m)

                for item in all_matches:
                    key = item.get("Key") or item.get("ResCode") or ""
                    match_id = f"bornan-{slug}-{key}"
                    res_code = item.get("ResCode") or key
                    stage = self.bornan.parse_stage_code(res_code)
                    status = item.get("_inferred_status", "UPCOMING")

                    home = item.get("Home", {})
                    away = item.get("Away", {})
                    orgs_list = item.get("Orgs", [])

                    team_a = home.get("Org") or (orgs_list[0] if len(orgs_list) > 0 else "UNK")
                    team_b = away.get("Org") or (orgs_list[1] if len(orgs_list) > 1 else None)

                    score_a = str(home.get("Result", "0"))
                    score_b = str(away.get("Result", "0"))

                    # Format athlete / team details
                    home_name = home.get("Name") or home.get("NameS") or ""
                    away_name = away.get("Name") or away.get("NameS") or ""
                    detail_parts = []
                    if home_name and away_name:
                        detail_parts.append(f"{home_name} vs {away_name}")
                    
                    is_cricket = slug in ["ckt", "cricket"]
                    if is_cricket:
                        score_a = re.sub(r'(\d+)\s*-\s*(\d+)', r'\1/\2', score_a)
                        score_b = re.sub(r'(\d+)\s*-\s*(\d+)', r'\1/\2', score_b)

                    # Split sets / innings scores if available
                    splits_a = [str(s.get("Res")) for s in home.get("Splits", []) if s.get("Res")]
                    splits_b = [str(s.get("Res")) for s in away.get("Splits", []) if s.get("Res")]
                    if splits_a and splits_b:
                        if is_cricket:
                            clean_a = [re.sub(r'(\d+)\s*-\s*(\d+)', r'\1/\2', s) for s in splits_a]
                            clean_b = [re.sub(r'(\d+)\s*-\s*(\d+)', r'\1/\2', s) for s in splits_b]
                            innings_parts = [f"{team_a}: {a} vs {team_b}: {b}" for a, b in zip(clean_a, clean_b)]
                            detail_parts.append(f"Innings: {', '.join(innings_parts)}")
                        else:
                            set_pairs = [f"{a}-{b}" for a, b in zip(splits_a, splits_b)]
                            detail_parts.append(f"Sets: {', '.join(set_pairs)}")

                    details = " | ".join(detail_parts)
                    winner = team_a if home.get("Winner") else (team_b if away.get("Winner") else None)

                    # Ensure countries exist for foreign keys
                    for c_code in [team_a, team_b]:
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
                        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                        ON CONFLICT(id) DO UPDATE SET
                            stage_round = excluded.stage_round,
                            status = excluded.status,
                            team_a_score = excluded.team_a_score,
                            team_b_score = excluded.team_b_score,
                            details = excluded.details,
                            winner_code = excluded.winner_code,
                            updated_at = CURRENT_TIMESTAMP;
                    """, (
                        match_id, slug, item.get("DiscDesc") or disc_name, stage, status,
                        "Official Asian Games Venue", team_a, team_b, score_a, score_b, details, winner
                    ))
                    synced_fixtures += 1

            cursor.execute("""
                INSERT INTO scraper_logs (status, items_synced, message)
                VALUES ('SUCCESS', ?, 'Bornan live results synced successfully');
            """, (synced_fixtures,))
            conn.commit()

            return {
                "status": "success",
                "source": "results.asiangames2026.org",
                "synced_fixtures": synced_fixtures,
                "medals_updated": medals_updated,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        except Exception as exc:
            cursor.execute("""
                INSERT INTO scraper_logs (status, items_synced, message)
                VALUES ('WARNING', ?, ?);
            """, (synced_fixtures, f"Bornan sync warning: {str(exc)}"))
            conn.commit()
            return {
                "status": "warning",
                "message": str(exc),
                "synced_fixtures": synced_fixtures,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        finally:
            conn.close()

    async def sync_fixtures_async(
        self, db_path: str, url: Optional[str] = None, html_override: Optional[str] = None
    ) -> Dict[str, Any]:
        if not url and not html_override:
            # Default to Bornan live sync
            return await self.sync_from_bornan_async(db_path)

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
                for c_code in [f["team_a_code"], f["team_b_code"]]:
                    if c_code:
                        cursor.execute("""
                            INSERT OR IGNORE INTO countries (code, name, flag_url)
                            VALUES (?, ?, '🏳️');
                        """, (c_code, c_code))

                canon_sport = SPORT_SLUG_MAP.get(f["sport_slug"].lower(), f["sport_slug"].lower())
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
                    f["id"], canon_sport, f["event_name"], f["stage_round"],
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
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                return pool.submit(
                    asyncio.run, self.sync_fixtures_async(db_path, url, html_override)
                ).result()
        else:
            return asyncio.run(self.sync_fixtures_async(db_path, url, html_override))

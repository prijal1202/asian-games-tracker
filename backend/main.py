from __future__ import annotations
import os
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from backend.database import get_db_connection, DB_PATH, init_db
from backend.scraper.engine import ScraperEngine
from backend.seed import seed_default_data

app = FastAPI(title="Asian Games Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_db_path() -> str:
    return os.environ.get("TRACKER_DB_PATH", DB_PATH)

@app.on_event("startup")
def startup_event():
    db_path = get_current_db_path()
    init_db(db_path)
    conn = get_db_connection(db_path)
    count = conn.execute("SELECT COUNT(*) FROM countries").fetchone()[0]
    conn.close()
    if count == 0:
        seed_default_data(db_path)

@app.get("/api/countries")
def get_countries():
    db_path = get_current_db_path()
    conn = get_db_connection(db_path)
    rows = conn.execute("""
        SELECT 
            c.code, c.name, c.flag_url, c.gold_medals, c.silver_medals, c.bronze_medals,
            (c.gold_medals + c.silver_medals + c.bronze_medals) as total_medals,
            COUNT(DISTINCT f.sport_slug) as total_sports
        FROM countries c
        LEFT JOIN fixtures f ON (f.team_a_code = c.code OR f.team_b_code = c.code)
        GROUP BY c.code
        ORDER BY c.gold_medals DESC, total_medals DESC, c.name ASC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/countries/{code}/overview")
def get_country_overview(code: str):
    db_path = get_current_db_path()
    conn = get_db_connection(db_path)
    country = conn.execute("SELECT * FROM countries WHERE code = ?", (code.upper(),)).fetchone()
    if not country:
        conn.close()
        raise HTTPException(status_code=404, detail="Country not found")

    fixtures = conn.execute("""
        SELECT f.*, s.name as sport_name, s.category as sport_category, s.icon as sport_icon
        FROM fixtures f
        JOIN sports s ON f.sport_slug = s.slug
        WHERE f.team_a_code = ? OR f.team_b_code = ?
        ORDER BY f.scheduled_at ASC
    """, (code.upper(), code.upper())).fetchall()
    conn.close()

    sports_map: Dict[str, Dict[str, Any]] = {}
    for f in fixtures:
        slug = f["sport_slug"]
        if slug not in sports_map:
            sports_map[slug] = {
                "sport_slug": slug,
                "sport_name": f["sport_name"],
                "sport_category": f["sport_category"],
                "sport_icon": f["sport_icon"],
                "current_stage": f["stage_round"],
                "active_status": "IN_COMPETITION",
                "fixtures": []
            }
        sports_map[slug]["fixtures"].append(dict(f))
        
        # Advance current stage if match is later round or medal match
        if any(keyword in f["stage_round"].lower() for keyword in ["final", "gold", "semi"]):
            sports_map[slug]["current_stage"] = f["stage_round"]

    return {
        "country": dict(country),
        "participating_sports": list(sports_map.values())
    }

@app.get("/api/sports")
def get_sports():
    db_path = get_current_db_path()
    conn = get_db_connection(db_path)
    rows = conn.execute("""
        SELECT s.*, COUNT(f.id) as fixture_count
        FROM sports s
        LEFT JOIN fixtures f ON f.sport_slug = s.slug
        GROUP BY s.slug
        ORDER BY s.name ASC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/fixtures")
def get_fixtures(
    country: Optional[str] = Query(None),
    sport: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    round: Optional[str] = Query(None)
):
    db_path = get_current_db_path()
    conn = get_db_connection(db_path)
    
    query = """
        SELECT f.*, s.name as sport_name, s.icon as sport_icon,
               ca.name as team_a_name, ca.flag_url as team_a_flag,
               cb.name as team_b_name, cb.flag_url as team_b_flag
        FROM fixtures f
        JOIN sports s ON f.sport_slug = s.slug
        JOIN countries ca ON f.team_a_code = ca.code
        LEFT JOIN countries cb ON f.team_b_code = cb.code
        WHERE 1=1
    """
    params: List[Any] = []
    
    if country:
        query += " AND (f.team_a_code = ? OR f.team_b_code = ?)"
        params.extend([country.upper(), country.upper()])
    if sport:
        query += " AND f.sport_slug = ?"
        params.append(sport)
    if status:
        query += " AND f.status = ?"
        params.append(status.upper())
    if round:
        query += " AND f.stage_round LIKE ?"
        params.append(f"%{round}%")

    query += " ORDER BY CASE f.status WHEN 'LIVE' THEN 1 WHEN 'UPCOMING' THEN 2 ELSE 3 END, f.scheduled_at ASC"
    
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/scraper/sync")
def trigger_sync(background_tasks: BackgroundTasks):
    db_path = get_current_db_path()
    engine = ScraperEngine()
    result = engine.sync_fixtures(db_path)
    return result

@app.get("/api/scraper/status")
def get_scraper_status():
    db_path = get_current_db_path()
    conn = get_db_connection(db_path)
    latest_log = conn.execute("SELECT * FROM scraper_logs ORDER BY id DESC LIMIT 1").fetchone()
    total_fixtures = conn.execute("SELECT COUNT(*) FROM fixtures").fetchone()[0]
    conn.close()
    
    if latest_log:
        return {
            "status": latest_log["status"],
            "last_sync": latest_log["timestamp"],
            "items_synced": latest_log["items_synced"],
            "message": latest_log["message"],
            "total_fixtures": total_fixtures
        }
    return {
        "status": "UNKNOWN",
        "last_sync": None,
        "items_synced": 0,
        "message": "No sync logs available",
        "total_fixtures": total_fixtures
    }

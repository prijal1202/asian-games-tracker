from __future__ import annotations
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
from backend.scraper.normalizer import CountryNormalizer, StageNormalizer

class FixtureParser:
    def parse_html(self, html_content: str) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html_content, "html.parser")
        match_nodes = soup.find_all(class_="match-item")
        fixtures: List[Dict[str, Any]] = []

        for node in match_nodes:
            match_id = node.get("data-id") or ""
            sport_elem = node.find(class_="sport")
            sport_slug = sport_elem.text.strip().lower() if sport_elem else "other"
            
            event_elem = node.find(class_="event")
            event_name = event_elem.text.strip() if event_elem else "General Event"
            
            stage_elem = node.find(class_="stage")
            raw_stage = stage_elem.text.strip() if stage_elem else "Preliminaries"
            stage_round = StageNormalizer.normalize(raw_stage)
            
            status_elem = node.find(class_="status")
            raw_status = status_elem.text.strip().upper() if status_elem else "UPCOMING"
            status = raw_status if raw_status in ("UPCOMING", "LIVE", "COMPLETED", "POSTPONED") else "UPCOMING"
            
            time_elem = node.find(class_="time")
            scheduled_at = time_elem.text.strip() if time_elem else "2026-09-25T12:00:00Z"
            
            venue_elem = node.find(class_="venue")
            venue = venue_elem.text.strip() if venue_elem else "Main Arena"
            
            team_a_node = node.find(class_="team-a")
            team_b_node = node.find(class_="team-b")
            
            country_a_raw = team_a_node.get("data-country", team_a_node.text) if team_a_node else ""
            country_b_raw = team_b_node.get("data-country", team_b_node.text) if team_b_node else ""
            
            team_a_code = CountryNormalizer.normalize(country_a_raw)
            team_b_code = CountryNormalizer.normalize(country_b_raw)
            
            if not team_a_code:
                continue

            score_a_elem = team_a_node.find(class_="score") if team_a_node else None
            score_b_elem = team_b_node.find(class_="score") if team_b_node else None
            
            team_a_score = score_a_elem.text.strip() if score_a_elem else "0"
            team_b_score = score_b_elem.text.strip() if score_b_elem else "0"
            
            details_elem = node.find(class_="details")
            details = details_elem.text.strip() if details_elem else ""

            winner_code = None
            if status == "COMPLETED" and team_b_code:
                try:
                    num_a = float(team_a_score.split()[0])
                    num_b = float(team_b_score.split()[0])
                    if num_a > num_b:
                        winner_code = team_a_code
                    elif num_b > num_a:
                        winner_code = team_b_code
                except ValueError:
                    winner_code = None

            fixtures.append({
                "id": match_id,
                "sport_slug": sport_slug,
                "event_name": event_name,
                "stage_round": stage_round,
                "status": status,
                "scheduled_at": scheduled_at,
                "venue": venue,
                "team_a_code": team_a_code,
                "team_b_code": team_b_code,
                "team_a_score": team_a_score,
                "team_b_score": team_b_score,
                "details": details,
                "winner_code": winner_code,
            })

        return fixtures

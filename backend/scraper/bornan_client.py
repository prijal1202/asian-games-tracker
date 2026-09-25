from __future__ import annotations
from typing import Any, Optional, Dict, List
import zlib
import json
import httpx
import re

class BornanClient:
    BASE_URL = "https://back.results.asiangames2026.org"
    CHAMP = "AG2026"
    LANG = "en"

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or self.BASE_URL
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Origin": "https://results.asiangames2026.org",
            "Referer": "https://results.asiangames2026.org/",
            "Accept": "*/*"
        }

    def decompress_payload(self, raw_text: str) -> Any:
        try:
            raw_bytes = raw_text.encode("latin-1")
            decompressed = zlib.decompress(raw_bytes)
            return json.loads(decompressed)
        except Exception:
            try:
                return json.loads(raw_text)
            except Exception as e:
                raise ValueError(f"Failed to decompress Bornan payload: {e}")

    def parse_stage_code(self, res_code: str) -> str:
        if not res_code:
            return "Preliminaries"
        code_upper = res_code.upper()
        if "FNL-" in code_upper or "FINAL" in code_upper:
            return "Final / Gold Medal Match"
        if "3P" in code_upper or "BRONZE" in code_upper:
            return "Bronze Medal Match"
        if "SFNL" in code_upper or "SEMI" in code_upper:
            return "Semi-final"
        if "QFNL" in code_upper or "QUARTER" in code_upper:
            return "Quarter-final"
        if "8FNL" in code_upper or "R16" in code_upper:
            return "Round of 16"
        if "R32" in code_upper:
            return "Round of 32"
        if "R64" in code_upper:
            return "Round of 64"
        if "GRP" in code_upper or "GROUP" in code_upper:
            return "Group Stage"
        return "Preliminaries"

    async def fetch_path(self, path: str) -> Optional[Any]:
        url = f"{self.base_url}{path}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=self.headers)
                if resp.status_code != 200:
                    return None
                return self.decompress_payload(resp.text)
        except Exception:
            return None

    async def fetch_disciplines(self) -> List[Dict[str, Any]]:
        path = f"/s/{self.CHAMP}/{self.LANG}/ALL/disc/list"
        data = await self.fetch_path(path)
        return data if isinstance(data, list) else []

    async def fetch_organizations(self) -> List[Dict[str, Any]]:
        path = f"/s/{self.CHAMP}/{self.LANG}/ALL/orgs/list"
        data = await self.fetch_path(path)
        return data if isinstance(data, list) else []

    async def fetch_medals_standings(self) -> List[Dict[str, Any]]:
        path = f"/s/{self.CHAMP}/{self.LANG}/ALL/medals/standings"
        data = await self.fetch_path(path)
        return data if isinstance(data, list) else []

    async def fetch_discipline_schedule(self, disc_key: str) -> Dict[str, Any]:
        path = f"/s/{self.CHAMP}/{self.LANG}/{disc_key}/schedule/landing"
        data = await self.fetch_path(path)
        return data if isinstance(data, dict) else {"last": [], "live": [], "next": []}

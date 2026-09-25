from __future__ import annotations
from typing import Optional
import re

COUNTRY_MAP = {
    "india": "IND",
    "ind": "IND",
    "team india": "IND",
    "japan": "JPN",
    "jpn": "JPN",
    "team japan": "JPN",
    "china": "CHN",
    "chn": "CHN",
    "people's republic of china": "CHN",
    "peoples republic of china": "CHN",
    "south korea": "KOR",
    "korea republic": "KOR",
    "republic of korea": "KOR",
    "kor": "KOR",
    "chinese taipei": "TPE",
    "tpe": "TPE",
    "taiwan": "TPE",
    "uzbekistan": "UZB",
    "uzb": "UZB",
    "iran": "IRI",
    "iri": "IRI",
    "thailand": "THA",
    "tha": "THA",
    "malaysia": "MAS",
    "mas": "MAS",
    "indonesia": "INA",
    "ina": "INA",
    "singapore": "SGP",
    "sgp": "SGP",
    "pakistan": "PAK",
    "pak": "PAK",
    "kazakhstan": "KAZ",
    "kaz": "KAZ",
}

class CountryNormalizer:
    @staticmethod
    def normalize(raw_name: str) -> Optional[str]:
        if not raw_name:
            return None
        cleaned = raw_name.strip().lower()
        cleaned = re.sub(r"[^\w\s]", "", cleaned)
        return COUNTRY_MAP.get(cleaned)

class StageNormalizer:
    @staticmethod
    def normalize(raw_stage: str) -> str:
        if not raw_stage:
            return "Preliminaries"
        cleaned = raw_stage.strip().lower()
        if "gold" in cleaned or ("final" in cleaned and "semi" not in cleaned and "quarter" not in cleaned):
            return "Final / Gold Medal Match"
        if "bronze" in cleaned or "3rd" in cleaned:
            return "Bronze Medal Match"
        if "semi" in cleaned:
            return "Semi-final"
        if "quarter" in cleaned or "qf" in cleaned:
            return "Quarter-final"
        if "round of 16" in cleaned or "r16" in cleaned:
            return "Round of 16"
        if "round of 32" in cleaned or "r32" in cleaned:
            return "Round of 32"
        if "group" in cleaned or "prelim" in cleaned or "heat" in cleaned:
            return "Preliminaries"
        return raw_stage.strip()

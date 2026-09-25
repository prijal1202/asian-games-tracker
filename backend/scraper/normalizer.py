from __future__ import annotations
from typing import Optional
import re

COUNTRY_MAP = {
    # Afghanistan
    "afghanistan": "AFG", "afg": "AFG",
    # Bahrain
    "bahrain": "BRN", "brn": "BRN",
    # Bangladesh
    "bangladesh": "BAN", "ban": "BAN",
    # Bhutan
    "bhutan": "BHU", "bhu": "BHU",
    # Brunei
    "brunei": "BRU", "bru": "BRU", "brunei darussalam": "BRU",
    # Cambodia
    "cambodia": "CAM", "cam": "CAM",
    # China
    "china": "CHN", "chn": "CHN", "people's republic of china": "CHN", "peoples republic of china": "CHN", "pr china": "CHN",
    # Hong Kong
    "hong kong": "HKG", "hkg": "HKG", "hong kong china": "HKG", "hong kong, china": "HKG",
    # India
    "india": "IND", "ind": "IND", "team india": "IND",
    # Indonesia
    "indonesia": "INA", "ina": "INA", "idn": "INA",
    # Iran
    "iran": "IRI", "iri": "IRI", "islamic republic of iran": "IRI",
    # Iraq
    "iraq": "IRQ", "irq": "IRQ",
    # Japan
    "japan": "JPN", "jpn": "JPN", "team japan": "JPN",
    # Jordan
    "jordan": "JOR", "jor": "JOR",
    # Kazakhstan
    "kazakhstan": "KAZ", "kaz": "KAZ",
    # Kuwait
    "kuwait": "KUW", "kuw": "KUW",
    # Kyrgyzstan
    "kyrgyzstan": "KGZ", "kgz": "KGZ",
    # Laos
    "laos": "LAO", "lao": "LAO", "lao pdr": "LAO",
    # Lebanon
    "lebanon": "LBN", "lbn": "LBN",
    # Macau
    "macau": "MAC", "mac": "MAC", "macau, china": "MAC", "macao": "MAC",
    # Malaysia
    "malaysia": "MAS", "mas": "MAS", "mys": "MAS",
    # Maldives
    "maldives": "MDV", "mdv": "MDV",
    # Mongolia
    "mongolia": "MGL", "mgl": "MGL",
    # Myanmar
    "myanmar": "MYA", "mya": "MYA", "burma": "MYA",
    # Nepal
    "nepal": "NEP", "nep": "NEP", "team nepal": "NEP",
    # North Korea
    "north korea": "PRK", "prk": "PRK", "dpr korea": "PRK", "democratic people's republic of korea": "PRK",
    # Oman
    "oman": "OMA", "oma": "OMA",
    # Pakistan
    "pakistan": "PAK", "pak": "PAK",
    # Palestine
    "palestine": "PLE", "ple": "PLE",
    # Philippines
    "philippines": "PHI", "phi": "PHI",
    # Qatar
    "qatar": "QAT", "qat": "QAT",
    # Saudi Arabia
    "saudi arabia": "KSA", "ksa": "KSA",
    # Singapore
    "singapore": "SGP", "sgp": "SGP", "sin": "SGP",
    # South Korea
    "south korea": "KOR", "kor": "KOR", "korea": "KOR", "korea republic": "KOR", "republic of korea": "KOR",
    # Sri Lanka
    "sri lanka": "SRI", "sri": "SRI",
    # Syria
    "syria": "SYR", "syr": "SYR", "syrian arab republic": "SYR",
    # Chinese Taipei
    "chinese taipei": "TPE", "tpe": "TPE", "taiwan": "TPE",
    # Tajikistan
    "tajikistan": "TJK", "tjk": "TJK",
    # Thailand
    "thailand": "THA", "tha": "THA",
    # Timor-Leste
    "timor-leste": "TLS", "tls": "TLS", "east timor": "TLS",
    # Turkmenistan
    "turkmenistan": "TKM", "tkm": "TKM",
    # UAE
    "united arab emirates": "UAE", "uae": "UAE",
    # Uzbekistan
    "uzbekistan": "UZB", "uzb": "UZB",
    # Vietnam
    "vietnam": "VIE", "vie": "VIE",
    # Yemen
    "yemen": "YEM", "yem": "YEM",
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

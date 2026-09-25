import pytest
import zlib
import json
from backend.scraper.bornan_client import BornanClient

def test_decompress_payload():
    original_dict = {"status": "success", "event": "Badminton Men's Singles"}
    json_bytes = json.dumps(original_dict).encode("utf-8")
    compressed = zlib.compress(json_bytes)
    # Simulate server sending compressed bytes as Latin-1 string
    server_text = compressed.decode("latin-1")

    client = BornanClient()
    result = client.decompress_payload(server_text)
    assert result == original_dict

def test_stage_code_parsing():
    client = BornanClient()
    assert client.parse_stage_code("X.DOUBLES-----------.8FNL.000400--") == "Round of 16"
    assert client.parse_stage_code("M.SINGLES-----------.QFNL.000100--") == "Quarter-final"
    assert client.parse_stage_code("W.SINGLES-----------.SFNL.000100--") == "Semi-final"
    assert client.parse_stage_code("M.SINGLES-----------.FNL-.000100--") == "Final / Gold Medal Match"
    assert client.parse_stage_code("M.DOUBLES-----------.R32-.000500--") == "Round of 32"

@pytest.mark.asyncio
async def test_bornan_client_mock_fetch():
    client = BornanClient()
    # Test handling of network errors / mock endpoint
    res = await client.fetch_path("/s/AG2026/en/INVALID/path")
    assert res is None or isinstance(res, (dict, list))

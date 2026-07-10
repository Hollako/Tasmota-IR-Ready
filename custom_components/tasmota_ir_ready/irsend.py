"""Helpers for building Tasmota IRSend MQTT payloads."""
from __future__ import annotations

import json
import re

_RAW_TIMING_RE = re.compile(r"^\d+(?:\s*,\s*\d+)+$")


def build_irsend_payload(data: str, protocol: str, bits: int, mode: str | None = None) -> str:
    """Build a Tasmota IRSend payload, auto-detecting raw timing data."""
    data = data.strip()
    if _is_raw_irsend_payload(data, mode):
        return data
    if data and not data.lower().startswith("0x"):
        data = f"0x{data}"
    return json.dumps(
        {
            "Protocol": protocol.upper(),
            "Bits": int(bits),
            "Data": data,
        }
    )


def _is_raw_irsend_payload(data: str, mode: str | None = None) -> bool:
    """Return True when the value looks like a Tasmota raw IRSend payload."""
    if mode and mode.lower() == "raw":
        return True
    lowered = data.lower()
    if lowered.startswith("raw,"):
        return True
    return bool(_RAW_TIMING_RE.fullmatch(data))

"""Tests for the GZ055BE1 protocol helper."""

import importlib.util
from pathlib import Path
import unittest

MODULE_PATH = (
    Path(__file__).parents[1]
    / "custom_components"
    / "tasmota_ir_ready"
    / "gz055be1.py"
)
SPEC = importlib.util.spec_from_file_location("gz055be1", MODULE_PATH)
gz055be1 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(gz055be1)

build_gz055be1_auto_frame = gz055be1.build_gz055be1_auto_frame
is_gz055be1 = gz055be1.is_gz055be1
is_gz055be1_frame = gz055be1.is_gz055be1_frame


class Gz055be1Test(unittest.TestCase):
    def test_recognizes_supported_aliases(self):
        self.assertTrue(is_gz055be1("TEKNOPOINT", 2))
        self.assertTrue(is_gz055be1("tcl112ac", "gz055be1"))
        self.assertFalse(is_gz055be1("GREE", 2))

    def test_builds_known_auto_baseline(self):
        frame = build_gz055be1_auto_frame(
            power="on",
            temperature=26,
            fan_mode="auto",
            swingv="off",
            swingh="auto",
            light="off",
        )

        self.assertEqual(frame.hex().upper(), "23CB26010064089500000000081E")
        self.assertEqual(frame[-1], sum(frame[:-1]) & 0xFF)
        self.assertTrue(is_gz055be1_frame("TEKNOPOINT", frame))

    def test_rejects_temperature_outside_auto_range(self):
        with self.assertRaises(ValueError):
            build_gz055be1_auto_frame(
                power="on",
                temperature=21,
                fan_mode="auto",
                swingv="off",
                swingh="off",
                light="on",
            )


if __name__ == "__main__":
    unittest.main()

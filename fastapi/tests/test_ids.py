from __future__ import annotations

import builtins
import os
import sys
import types
import unittest
from unittest.mock import patch

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

from app.utils.ids import generate_cuid


class IdGenerationTests(unittest.TestCase):
    def test_generate_cuid_prefers_cuid2_when_available(self):
        fake_module = types.ModuleType("cuid2")

        class FakeCuid:
            def generate(self):
                return "cuid2-generated-value"

        fake_module.Cuid = FakeCuid

        with patch.dict(sys.modules, {"cuid2": fake_module}):
            self.assertEqual(generate_cuid(), "cuid2-generated-value")

    def test_generate_cuid_falls_back_to_uuid_hex(self):
        real_import = builtins.__import__

        def fake_import(name, globals=None, locals=None, fromlist=(), level=0):  # noqa: ARG001
            if name == "cuid2":
                raise ImportError("cuid2 is not available")
            return real_import(name, globals, locals, fromlist, level)

        with patch("builtins.__import__", side_effect=fake_import):
            generated = generate_cuid()

        self.assertRegex(generated, r"^[0-9a-f]{32}$")


if __name__ == "__main__":
    unittest.main()

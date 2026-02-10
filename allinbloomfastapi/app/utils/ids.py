from __future__ import annotations

from uuid import uuid4


def generate_cuid() -> str:
    try:
        from cuid2 import Cuid

        return Cuid().generate()
    except Exception:
        return uuid4().hex

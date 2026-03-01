from __future__ import annotations


LEGACY_COLOR_MAP = {
    "blush": "pink",
    "ivory": "white",
    "ruby": "burgundy",
    "sage": "light blue",
    "lavender": "lavender",
    "peach": "peach",
    "champagne": "yellow",
    "champange": "yellow",
}

COLOR_VALUES = {
    "pink",
    "white",
    "red",
    "peach",
    "blue",
    "lavender",
    "orange",
    "light blue",
    "burgundy",
    "yellow",
}


def normalize_color_value(value: str | None) -> str | None:
    token = (value or "").strip().lower()
    if not token:
        return None
    mapped = LEGACY_COLOR_MAP.get(token, token)
    if mapped in COLOR_VALUES:
        return mapped
    return None


def normalize_palette_text(value: str | None) -> str:
    normalized = (value or "").lower()
    for legacy, replacement in LEGACY_COLOR_MAP.items():
        normalized = normalized.replace(legacy, replacement)
    return normalized


def normalize_color_csv(value: str | None) -> str:
    parts = (value or "").split(",")
    normalized: list[str] = []
    for raw in parts:
        token = raw.strip().lower()
        if not token:
            continue
        mapped = normalize_color_value(token) or token
        if mapped not in normalized:
            normalized.append(mapped)
    return ", ".join(normalized)


def color_filter_candidates(value: str | None) -> list[str]:
    token = (value or "").strip().lower()
    if not token:
        return []

    normalized = normalize_color_value(token) or token
    candidates = [normalized]

    for legacy, mapped in LEGACY_COLOR_MAP.items():
        if mapped == normalized and legacy not in candidates:
            candidates.append(legacy)
    return candidates

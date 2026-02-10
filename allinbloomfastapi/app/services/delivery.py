from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import httpx

from app.core.config import settings


DELIVERY_TIERS = [
    {"max_miles": 10, "fee_cents": 0},
    {"max_miles": 20, "fee_cents": 1500},
    {"max_miles": 30, "fee_cents": 3000},
]


@dataclass
class DeliveryQuote:
    ok: bool
    miles: Optional[float] = None
    distance_text: Optional[str] = None
    fee_cents: Optional[int] = None
    base_address: Optional[str] = None
    formatted_address: Optional[str] = None
    error: Optional[str] = None


def _validate_address_format(address: str) -> Optional[str]:
    trimmed = address.strip()
    if len(trimmed) < 10:
        return "Address is too short. Please provide a complete address."
    if not any(char.isdigit() for char in trimmed):
        return "Please include a street number."
    if "," not in trimmed:
        return "Please provide a complete address with city and state (e.g., 123 Main St, Chicago, IL)."
    return None


async def _validate_and_geocode(address: str, api_key: str) -> tuple[bool, str | None, str | None]:
    params = {"address": address, "key": api_key}
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            "https://maps.googleapis.com/maps/api/geocode/json", params=params
        )
    if response.status_code != 200:
        return False, None, "Unable to validate address."
    data = response.json()
    status = data.get("status")
    results = data.get("results") or []
    if status == "ZERO_RESULTS":
        return False, None, "Address not found. Please check and try again."
    if status != "OK" or not results:
        return False, None, "Unable to validate address."

    result = results[0]
    types = result.get("types") or []
    is_vague = any(
        t in ["country", "administrative_area_level_1", "administrative_area_level_2", "locality"]
        for t in types
    ) and "street_address" not in types and "premise" not in types
    if is_vague:
        return False, None, "Please provide a complete street address, not just a city."

    components = result.get("address_components") or []
    has_street_number = any("street_number" in (c.get("types") or []) for c in components)
    if not has_street_number:
        return False, None, "Please include a street number in your address."
    has_route = any("route" in (c.get("types") or []) for c in components)
    if not has_route:
        return False, None, "Please include a street name in your address."

    return True, result.get("formatted_address"), None


def get_delivery_fee_cents(miles: float) -> Optional[int]:
    for tier in DELIVERY_TIERS:
        if miles <= tier["max_miles"]:
            return tier["fee_cents"]
    return None


async def get_delivery_quote(raw_address: str) -> DeliveryQuote:
    address = raw_address.strip()
    if not address:
        return DeliveryQuote(ok=False, error="Delivery address is required.")

    api_key = settings.google_maps_api_key
    if not api_key:
        return DeliveryQuote(ok=False, error="Delivery is not configured.")

    format_error = _validate_address_format(address)
    if format_error:
        return DeliveryQuote(ok=False, error=format_error)

    valid, formatted_address, error = await _validate_and_geocode(address, api_key)
    if not valid or not formatted_address:
        return DeliveryQuote(ok=False, error=error or "Unable to validate address.")

    base_address = settings.delivery_base_address
    params = {
        "origins": base_address,
        "destinations": formatted_address,
        "units": "imperial",
        "key": api_key,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            "https://maps.googleapis.com/maps/api/distancematrix/json", params=params
        )

    if response.status_code != 200:
        return DeliveryQuote(ok=False, error="Unable to calculate delivery distance.")
    data = response.json()
    if data.get("status") != "OK":
        return DeliveryQuote(ok=False, error="Unable to calculate delivery distance.")

    element = (data.get("rows") or [{}])[0].get("elements", [{}])[0]
    if element.get("status") != "OK":
        return DeliveryQuote(ok=False, error="Address not reachable for delivery.")

    meters = (element.get("distance") or {}).get("value")
    if not isinstance(meters, (int, float)):
        return DeliveryQuote(ok=False, error="Unable to calculate delivery distance.")

    miles = round((meters / 1609.344) * 100) / 100
    fee_cents = get_delivery_fee_cents(miles)
    if fee_cents is None:
        max_miles = DELIVERY_TIERS[-1]["max_miles"]
        return DeliveryQuote(
            ok=False,
            error=f"Delivery is available within {max_miles} miles of our studio. Your address is {miles:.1f} miles away.",
        )

    distance_text = (element.get("distance") or {}).get("text") or f"{miles:.1f} mi"

    return DeliveryQuote(
        ok=True,
        miles=miles,
        distance_text=distance_text,
        fee_cents=fee_cents,
        base_address=base_address,
        formatted_address=formatted_address,
    )

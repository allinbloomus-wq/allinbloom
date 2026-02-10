from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.delivery import DeliveryQuoteOut, DeliveryQuoteRequest
from app.services.delivery import get_delivery_quote

router = APIRouter(prefix="/api/delivery", tags=["delivery"])


@router.post("/quote", response_model=DeliveryQuoteOut)
async def quote_delivery(payload: DeliveryQuoteRequest):
    result = await get_delivery_quote(payload.address)
    if not result.ok:
        raise HTTPException(status_code=400, detail=result.error or "Unable to calculate delivery.")
    return DeliveryQuoteOut(
        fee_cents=result.fee_cents or 0,
        miles=result.miles or 0,
        distance_text=result.distance_text or "",
    )

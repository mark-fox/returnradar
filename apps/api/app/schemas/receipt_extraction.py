from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class ReceiptExtractionRequest(BaseModel):
    raw_text: str = Field(..., min_length=1)


class ReceiptProductSuggestion(BaseModel):
    name: str
    merchant: Optional[str] = None
    purchase_date: Optional[date] = None
    return_deadline: Optional[date] = None
    warranty_deadline: Optional[date] = None
    price_cents: Optional[int] = None
    currency: str = "USD"
    notes: Optional[str] = None


class ReceiptExtractionResponse(BaseModel):
    source: str
    confidence: float = Field(..., ge=0, le=1)
    suggestion: ReceiptProductSuggestion
    warnings: list[str] = []
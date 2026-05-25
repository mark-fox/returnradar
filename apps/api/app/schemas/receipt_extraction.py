from datetime import date

from pydantic import BaseModel, Field


class ReceiptExtractionRequest(BaseModel):
    raw_text: str = Field(..., min_length=1)


class ReceiptProductSuggestion(BaseModel):
    name: str
    merchant: str | None = None
    warranty_provider: str | None = None
    purchase_date: date | None = None
    return_deadline: date | None = None
    warranty_deadline: date | None = None
    price_cents: int | None = None
    currency: str = "USD"
    notes: str | None = None


class ReceiptLineItem(BaseModel):
    name: str
    price_cents: int | None = None


class ReceiptExtractionResponse(BaseModel):
    source: str
    confidence: float = Field(..., ge=0, le=1)
    suggestion: ReceiptProductSuggestion
    warnings: list[str] = Field(default_factory=list)
    line_items: list[ReceiptLineItem] = Field(default_factory=list)
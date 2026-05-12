from dataclasses import dataclass
from datetime import date


@dataclass
class ReceiptExtractionResult:
    name: str
    merchant: str | None
    purchase_date: date | None
    return_deadline: date | None
    warranty_deadline: date | None
    price_cents: int | None
    currency: str
    notes: str | None
    confidence: float
    provider: str
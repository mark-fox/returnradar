import re
from datetime import date, timedelta

from app.services.receipt_extraction.base import ReceiptExtractionProvider
from app.services.receipt_extraction.types import ReceiptExtractionResult


def extract_price_cents(raw_text: str) -> int | None:
    price_matches = re.findall(r"\$?\b(\d+\.\d{2})\b", raw_text)

    if not price_matches:
        return None

    price_as_float = float(price_matches[-1])

    return round(price_as_float * 100)


def extract_merchant(raw_text: str) -> str | None:
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

    if not lines:
        return None

    return lines[0][:255]


def extract_product_name(raw_text: str) -> str:
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

    ignored_terms = (
        "subtotal",
        "tax",
        "total",
        "visa",
        "mastercard",
        "change",
    )

    for line in lines[1:]:
        lower_line = line.lower()

        if any(term in lower_line for term in ignored_terms):
            continue

        if re.search(r"[A-Za-z]", line):
            return line[:255]

    return "Unknown product"


class MockReceiptExtractionProvider(ReceiptExtractionProvider):
    def extract(self, raw_text: str) -> ReceiptExtractionResult:
        today = date.today()

        return ReceiptExtractionResult(
            name=extract_product_name(raw_text),
            merchant=extract_merchant(raw_text),
            purchase_date=today,
            return_deadline=today + timedelta(days=30),
            warranty_deadline=today + timedelta(days=365),
            price_cents=extract_price_cents(raw_text),
            currency="USD",
            notes="AI-suggested details. Verify against the receipt and retailer policy.",
            confidence=0.62,
            provider="mock",
        )
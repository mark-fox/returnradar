import re
from datetime import date, timedelta
from typing import Protocol

from app.schemas.receipt_extraction import (
    ReceiptExtractionResponse,
    ReceiptProductSuggestion,
)
from app.core.config import settings


class ReceiptExtractor(Protocol):
    def extract(self, raw_text: str) -> ReceiptExtractionResponse:
        pass


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

    ignored_terms = ("subtotal", "tax", "total", "visa", "mastercard", "change")

    for line in lines[1:]:
        lower_line = line.lower()

        if any(term in lower_line for term in ignored_terms):
            continue

        if re.search(r"[A-Za-z]", line):
            return line[:255]

    return "Unknown product"


class MockReceiptExtractor:
    def extract(self, raw_text: str) -> ReceiptExtractionResponse:
        merchant = extract_merchant(raw_text)
        product_name = extract_product_name(raw_text)
        price_cents = extract_price_cents(raw_text)

        today = date.today()

        warnings = [
            "This is a mock extraction. User confirmation is required before saving.",
            "Return and warranty dates are estimates, not guarantees.",
        ]

        return ReceiptExtractionResponse(
            source="mock",
            confidence=0.62,
            suggestion=ReceiptProductSuggestion(
                name=product_name,
                merchant=merchant,
                purchase_date=today,
                return_deadline=today + timedelta(days=30),
                warranty_deadline=today + timedelta(days=365),
                price_cents=price_cents,
                currency="USD",
                notes="AI-suggested details. Verify against the receipt and retailer policy.",
            ),
            warnings=warnings,
        )


def build_receipt_extractor() -> ReceiptExtractor:
    if settings.receipt_extractor_provider == "mock":
        return MockReceiptExtractor()

    raise ValueError(
        f"Unsupported receipt extractor provider: {settings.receipt_extractor_provider}"
    )


default_receipt_extractor: ReceiptExtractor = build_receipt_extractor()


def extract_receipt_suggestion(raw_text: str) -> ReceiptExtractionResponse:
    return default_receipt_extractor.extract(raw_text)
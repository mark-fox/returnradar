from app.core.config import settings
from app.services.receipt_extraction.base import ReceiptExtractionProvider
from app.services.receipt_extraction.mock_provider import (
    MockReceiptExtractionProvider,
)


def get_receipt_extraction_provider() -> ReceiptExtractionProvider:
    provider = settings.receipt_extractor_provider.lower()

    if provider == "mock":
        return MockReceiptExtractionProvider()

    raise ValueError(f"Unsupported receipt extraction provider: {provider}")
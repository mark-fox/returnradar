from fastapi import APIRouter

from app.core.config import settings
from app.schemas.receipt_extraction import (
    ReceiptExtractionRequest,
    ReceiptExtractionResponse,
    ReceiptProductSuggestion,
)
from app.services.receipt_extraction import (
    OpenAIReceiptExtractor,
    extract_receipt_suggestion,
)

router = APIRouter(prefix="/ai", tags=["ai"])

@router.get("/status")
def get_ai_status() -> dict[str, object]:
    provider = settings.receipt_extractor_provider

    return {
        "receipt_extractor_provider": provider,
        "openai_configured": bool(settings.openai_api_key),
    }

@router.post(
    "/test-openai",
    response_model=ReceiptExtractionResponse,
)
def test_openai_receipt_extraction(
    request: ReceiptExtractionRequest,
) -> ReceiptExtractionResponse:
    extractor = OpenAIReceiptExtractor()

    return extractor.extract(request.raw_text)

@router.post("/receipt-extract", response_model=ReceiptExtractionResponse)
def extract_receipt(
    request: ReceiptExtractionRequest,
) -> ReceiptExtractionResponse:
    return extract_receipt_suggestion(request.raw_text)
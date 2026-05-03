from fastapi import APIRouter

from app.schemas.receipt_extraction import (
    ReceiptExtractionRequest,
    ReceiptExtractionResponse,
)
from app.services.receipt_extraction import extract_receipt_suggestion

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/receipt-extract", response_model=ReceiptExtractionResponse)
def extract_receipt(
    request: ReceiptExtractionRequest,
) -> ReceiptExtractionResponse:
    return extract_receipt_suggestion(request.raw_text)
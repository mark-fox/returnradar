from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, File, UploadFile, HTTPException

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

MAX_RECEIPT_IMAGE_BYTES = 8 * 1024 * 1024

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

@router.post(
    "/receipt-image",
    response_model=ReceiptExtractionResponse,
)
async def upload_receipt_image(
    image: UploadFile = File(...),
) -> ReceiptExtractionResponse:
    allowed_content_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
    }

    content_type_extensions = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }

    if image.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type: {image.content_type}",
        )

    contents = await image.read()
    if len(contents) > MAX_RECEIPT_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Receipt image is too large. Maximum size is 8 MB.",
        )
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(exist_ok=True)

    file_extension = content_type_extensions[image.content_type]
    filename = f"{uuid4()}{file_extension}"
    file_path = uploads_dir / filename

    file_path.write_bytes(contents)

    extractor = OpenAIReceiptExtractor()
    extraction_response = extractor.extract_from_image(contents)

    extraction_response.warnings.insert(
        0,
        f"receipt_image_path:{file_path.as_posix()}",
    )

    return extraction_response

@router.post("/receipt-extract", response_model=ReceiptExtractionResponse)
def extract_receipt(
    request: ReceiptExtractionRequest,
) -> ReceiptExtractionResponse:
    return extract_receipt_suggestion(request.raw_text)
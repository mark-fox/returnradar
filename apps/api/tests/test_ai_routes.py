from fastapi.testclient import TestClient
from unittest.mock import patch

from app.core.config import settings
from app.schemas.receipt_extraction import ReceiptExtractionResponse, ReceiptProductSuggestion


def test_ai_status_returns_provider_info(
    client: TestClient,
    monkeypatch,
) -> None:
    monkeypatch.setattr(settings, "receipt_extractor_provider", "mock")
    monkeypatch.setattr(settings, "openai_api_key", None)

    response = client.get("/api/v1/ai/status")

    assert response.status_code == 200

    payload = response.json()

    assert payload["receipt_extractor_provider"] == "mock"
    assert payload["openai_configured"] is False


def test_ai_status_detects_openai_configuration(
    client: TestClient,
    monkeypatch,
) -> None:
    monkeypatch.setattr(settings, "receipt_extractor_provider", "openai")
    monkeypatch.setattr(settings, "openai_api_key", "fake-key")

    response = client.get("/api/v1/ai/status")

    assert response.status_code == 200

    payload = response.json()

    assert payload["receipt_extractor_provider"] == "openai"
    assert payload["openai_configured"] is True


def test_receipt_image_upload_accepts_png(
    client: TestClient,
) -> None:
    fake_response = ReceiptExtractionResponse(
        source="openai-vision",
        confidence=0.88,
        suggestion=ReceiptProductSuggestion(
            name="Mock Receipt Product",
            merchant="Mock Store",
            warranty_provider="Geek Squad",
            purchase_date=None,
            return_deadline=None,
            warranty_deadline=None,
            price_cents=1299,
            currency="USD",
            notes=None,
        ),
        warnings=[],
        line_items=[],
    )

    with patch(
        "app.services.receipt_extraction.OpenAIReceiptExtractor.extract_from_image",
        return_value=fake_response,
    ):
        response = client.post(
            "/api/v1/ai/receipt-image",
            files={
                "image": (
                    "receipt.png",
                    b"fake-image-data",
                    "image/png",
                )
            },
        )

    assert response.status_code == 200

    payload = response.json()

    assert payload["source"] == "openai-vision"
    assert payload["suggestion"]["name"] == "Mock Receipt Product"
    assert payload["suggestion"]["warranty_provider"] == "Geek Squad"


def test_receipt_image_upload_rejects_invalid_types(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/ai/receipt-image",
        files={
            "image": (
                "receipt.txt",
                b"not-an-image",
                "text/plain",
            )
        },
    )

    assert response.status_code == 400

    payload = response.json()

    assert "Unsupported image type" in payload["detail"]


def test_receipt_image_upload_rejects_large_images(
    client: TestClient,
) -> None:
    oversized_image = b"0" * ((8 * 1024 * 1024) + 1)

    response = client.post(
        "/api/v1/ai/receipt-image",
        files={
            "image": (
                "large-receipt.png",
                oversized_image,
                "image/png",
            )
        },
    )

    assert response.status_code == 413

    payload = response.json()

    assert payload["detail"] == "Receipt image is too large. Maximum size is 8 MB."


def test_receipt_image_upload_returns_503_when_openai_is_not_configured(
    client: TestClient,
    monkeypatch,
) -> None:
    monkeypatch.setattr(settings, "openai_api_key", None)

    response = client.post(
        "/api/v1/ai/receipt-image",
        files={
            "image": (
                "receipt.png",
                b"fake-image-data",
                "image/png",
            )
        },
    )

    assert response.status_code == 503

    payload = response.json()

    assert payload["detail"] == "OPENAI_API_KEY is not configured"


def test_receipt_image_upload_503_does_not_write_file(
    client: TestClient,
    monkeypatch,
    tmp_path,
) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(settings, "openai_api_key", None)

    response = client.post(
        "/api/v1/ai/receipt-image",
        files={
            "image": (
                "receipt.png",
                b"fake-image-data",
                "image/png",
            )
        },
    )

    assert response.status_code == 503

    uploads_dir = tmp_path / "uploads"

    assert not uploads_dir.exists()
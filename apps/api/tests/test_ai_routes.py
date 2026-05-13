from fastapi.testclient import TestClient

from app.core.config import settings


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

    assert payload["filename"] == "receipt.png"
    assert payload["content_type"] == "image/png"
    assert payload["ready_for_ocr"] is True


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
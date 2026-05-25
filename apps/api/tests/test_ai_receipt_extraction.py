from fastapi.testclient import TestClient


def test_receipt_extraction_returns_suggestion(client: TestClient) -> None:
    response = client.post(
        "/api/v1/ai/receipt-extract",
        json={
            "raw_text": (
                "BEST BUY\n"
                "Sony WH-1000XM5 Headphones\n"
                "Subtotal 399.99\n"
                "Tax 31.20\n"
                "Total 431.19\n"
                "VISA"
            )
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["source"] == "mock"
    assert data["confidence"] == 0.62
    assert data["warnings"]

    suggestion = data["suggestion"]

    assert suggestion["name"] == "Sony WH-1000XM5 Headphones"
    assert suggestion["merchant"] == "BEST BUY"
    assert suggestion["warranty_provider"] == "Geek Squad"
    assert suggestion["price_cents"] == 43119
    assert suggestion["currency"] == "USD"
    assert suggestion["purchase_date"] is not None
    assert suggestion["return_deadline"] is not None
    assert suggestion["warranty_deadline"] is not None
    assert "Verify" in suggestion["notes"]


def test_receipt_extraction_requires_raw_text(client: TestClient) -> None:
    response = client.post(
        "/api/v1/ai/receipt-extract",
        json={"raw_text": ""},
    )

    assert response.status_code == 422


def test_receipt_extraction_handles_minimal_text(client: TestClient) -> None:
    response = client.post(
        "/api/v1/ai/receipt-extract",
        json={"raw_text": "TARGET"},
    )

    assert response.status_code == 200

    data = response.json()
    suggestion = data["suggestion"]

    assert suggestion["merchant"] == "TARGET"
    assert suggestion["name"] == "Unknown product"
    assert suggestion["price_cents"] is None
    assert suggestion["currency"] == "USD"
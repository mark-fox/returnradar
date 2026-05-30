from fastapi.testclient import TestClient


def test_create_product(client: TestClient) -> None:
    payload = {
        "name": "Test Headphones",
        "merchant": "Best Buy",
        "purchase_date": "2026-04-28",
        "return_deadline": "2026-05-28",
        "warranty_deadline": "2027-04-28",
        "price_cents": 39999,
        "currency": "USD",
        "notes": "Created by automated test.",
    }

    response = client.post("/api/v1/products", json=payload)

    assert response.status_code == 201

    data = response.json()

    assert data["id"] is not None
    assert data["name"] == payload["name"]
    assert data["merchant"] == payload["merchant"]
    assert data["price_cents"] == payload["price_cents"]
    assert data["currency"] == "USD"
    assert data["created_at"] is not None
    assert data["updated_at"] is not None


def test_list_products(client: TestClient) -> None:
    response = client.get("/api/v1/products")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_missing_product_returns_404(client: TestClient) -> None:
    response = client.get("/api/v1/products/999999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Product not found"


def test_update_product(client: TestClient) -> None:
    create_response = client.post(
        "/api/v1/products",
        json={
            "name": "Original Product",
            "merchant": "Target",
            "price_cents": 1299,
            "currency": "USD",
        },
    )

    assert create_response.status_code == 201

    product_id = create_response.json()["id"]

    update_response = client.patch(
        f"/api/v1/products/{product_id}",
        json={
            "name": "Updated Product",
            "notes": "Updated by automated test.",
        },
    )

    assert update_response.status_code == 200

    data = update_response.json()

    assert data["id"] == product_id
    assert data["name"] == "Updated Product"
    assert data["merchant"] == "Target"
    assert data["notes"] == "Updated by automated test."


def test_delete_product(client: TestClient) -> None:
    create_response = client.post(
        "/api/v1/products",
        json={
            "name": "Product To Delete",
            "merchant": "Amazon",
            "price_cents": 2599,
            "currency": "USD",
        },
    )

    assert create_response.status_code == 201

    product_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/v1/products/{product_id}")

    assert delete_response.status_code == 204

    get_response = client.get(f"/api/v1/products/{product_id}")

    assert get_response.status_code == 404


def test_create_product_rejects_invalid_source(client: TestClient) -> None:
    response = client.post(
        "/api/v1/products",
        json={
            "name": "Invalid Source Product",
            "source": "banana",
        },
    )

    assert response.status_code == 422


def test_update_product_rejects_invalid_source(client: TestClient) -> None:
    create_response = client.post(
        "/api/v1/products",
        json={
            "name": "Source Update Product",
            "source": "manual",
        },
    )

    assert create_response.status_code == 201

    product_id = create_response.json()["id"]

    update_response = client.patch(
        f"/api/v1/products/{product_id}",
        json={
            "source": "banana",
        },
    )

    assert update_response.status_code == 422


def test_list_products_supports_limit_and_offset(client: TestClient) -> None:
    for index in range(3):
        response = client.post(
            "/api/v1/products",
            json={
                "name": f"Paginated Product {index}",
                "source": "manual",
            },
        )

        assert response.status_code == 201

    list_response = client.get("/api/v1/products?limit=2&offset=0")

    assert list_response.status_code == 200
    assert len(list_response.json()) <= 2


def test_list_products_rejects_invalid_limit(client: TestClient) -> None:
    response = client.get("/api/v1/products?limit=0")

    assert response.status_code == 422


def test_list_products_rejects_invalid_offset(client: TestClient) -> None:
    response = client.get("/api/v1/products?offset=-1")

    assert response.status_code == 422


def test_list_products_supports_search(client: TestClient) -> None:
    create_matching_response = client.post(
        "/api/v1/products",
        json={
            "name": "Searchable Headphones",
            "merchant": "Best Buy",
            "notes": "Noise cancelling audio gear",
            "source": "manual",
        },
    )

    assert create_matching_response.status_code == 201

    create_non_matching_response = client.post(
        "/api/v1/products",
        json={
            "name": "Reusable Water Bottle",
            "merchant": "Target",
            "notes": "Kitchen item",
            "source": "manual",
        },
    )

    assert create_non_matching_response.status_code == 201

    search_response = client.get("/api/v1/products?search=headphones")

    assert search_response.status_code == 200

    names = [product["name"] for product in search_response.json()]

    assert "Searchable Headphones" in names
    assert "Reusable Water Bottle" not in names


def test_list_products_searches_merchant_and_notes(client: TestClient) -> None:
    response = client.post(
        "/api/v1/products",
        json={
            "name": "Generic Product",
            "merchant": "Unique Merchant Search Store",
            "notes": "Special warranty note",
            "source": "manual",
        },
    )

    assert response.status_code == 201

    merchant_search_response = client.get("/api/v1/products?search=unique merchant")
    notes_search_response = client.get("/api/v1/products?search=special warranty")

    assert merchant_search_response.status_code == 200
    assert notes_search_response.status_code == 200

    assert any(
        product["name"] == "Generic Product"
        for product in merchant_search_response.json()
    )
    assert any(
        product["name"] == "Generic Product"
        for product in notes_search_response.json()
    )


def test_list_products_supports_sort_by_name(client: TestClient) -> None:
    first_response = client.post(
        "/api/v1/products",
        json={
            "name": "Alpha Sort Product",
            "source": "manual",
        },
    )
    second_response = client.post(
        "/api/v1/products",
        json={
            "name": "Zulu Sort Product",
            "source": "manual",
        },
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201

    response = client.get("/api/v1/products?search=Sort Product&sort_by=name&sort_direction=asc")

    assert response.status_code == 200

    names = [product["name"] for product in response.json()]

    assert names.index("Alpha Sort Product") < names.index("Zulu Sort Product")


def test_list_products_rejects_invalid_sort_by(client: TestClient) -> None:
    response = client.get("/api/v1/products?sort_by=banana")

    assert response.status_code == 422


def test_list_products_rejects_invalid_sort_direction(client: TestClient) -> None:
    response = client.get("/api/v1/products?sort_direction=sideways")

    assert response.status_code == 422


def test_update_product_allows_warranty_metadata(
    client: TestClient,
) -> None:
    create_response = client.post(
        "/api/v1/products",
        json={
            "name": "Headphones",
            "merchant": "Best Buy",
            "currency": "USD",
        },
    )

    assert create_response.status_code == 201

    product_id = create_response.json()["id"]

    update_response = client.patch(
        f"/api/v1/products/{product_id}",
        json={
            "warranty_provider": "Geek Squad",
            "warranty_claim_url": "https://example.com/claim",
            "warranty_notes": "Bring receipt and serial number.",
        },
    )

    assert update_response.status_code == 200

    payload = update_response.json()

    assert payload["warranty_provider"] == "Geek Squad"
    assert payload["warranty_claim_url"] == "https://example.com/claim"
    assert payload["warranty_notes"] == "Bring receipt and serial number."


def test_archive_product_hides_product_from_default_list(
    client: TestClient,
) -> None:
    create_response = client.post(
        "/api/v1/products",
        json={
            "name": "Product To Archive",
            "merchant": "Target",
            "source": "manual",
        },
    )

    assert create_response.status_code == 201

    product_id = create_response.json()["id"]

    archive_response = client.post(f"/api/v1/products/{product_id}/archive")

    assert archive_response.status_code == 200
    assert archive_response.json()["is_archived"] is True

    default_list_response = client.get("/api/v1/products")

    assert default_list_response.status_code == 200

    default_list_ids = [
        product["id"]
        for product in default_list_response.json()
    ]

    assert product_id not in default_list_ids

    archived_list_response = client.get("/api/v1/products?include_archived=true")

    assert archived_list_response.status_code == 200

    archived_list_ids = [
        product["id"]
        for product in archived_list_response.json()
    ]

    assert product_id in archived_list_ids


def test_restore_product_returns_product_to_default_list(
    client: TestClient,
) -> None:
    create_response = client.post(
        "/api/v1/products",
        json={
            "name": "Product To Restore",
            "merchant": "Best Buy",
            "source": "manual",
        },
    )

    assert create_response.status_code == 201

    product_id = create_response.json()["id"]

    archive_response = client.post(f"/api/v1/products/{product_id}/archive")

    assert archive_response.status_code == 200
    assert archive_response.json()["is_archived"] is True

    restore_response = client.post(f"/api/v1/products/{product_id}/restore")

    assert restore_response.status_code == 200
    assert restore_response.json()["is_archived"] is False

    default_list_response = client.get("/api/v1/products")

    assert default_list_response.status_code == 200

    default_list_ids = [
        product["id"]
        for product in default_list_response.json()
    ]

    assert product_id in default_list_ids


def test_list_products_searches_warranty_metadata(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/products",
        json={
            "name": "Warranty Search Product",
            "merchant": "Best Buy",
            "warranty_provider": "Geek Squad",
            "warranty_notes": "Bring serial number and receipt.",
            "source": "manual",
        },
    )

    assert response.status_code == 201

    provider_search_response = client.get("/api/v1/products?search=geek squad")
    notes_search_response = client.get("/api/v1/products?search=serial number")

    assert provider_search_response.status_code == 200
    assert notes_search_response.status_code == 200

    assert any(
        product["name"] == "Warranty Search Product"
        for product in provider_search_response.json()
    )
    assert any(
        product["name"] == "Warranty Search Product"
        for product in notes_search_response.json()
    )


def test_list_deadline_reminders_returns_upcoming_and_expired_deadlines(
    client: TestClient,
) -> None:
    upcoming_response = client.post(
        "/api/v1/products",
        json={
            "name": "Upcoming Return Product",
            "merchant": "Target",
            "purchase_date": "2026-05-01",
            "return_deadline": "2026-05-28",
            "warranty_deadline": "2026-06-15",
            "source": "manual",
        },
    )

    expired_response = client.post(
        "/api/v1/products",
        json={
            "name": "Expired Return Product",
            "merchant": "Best Buy",
            "purchase_date": "2026-05-01",
            "return_deadline": "2026-05-20",
            "source": "manual",
        },
    )

    far_future_response = client.post(
        "/api/v1/products",
        json={
            "name": "Far Future Product",
            "merchant": "Costco",
            "purchase_date": "2026-05-01",
            "return_deadline": "2026-12-31",
            "warranty_deadline": "2027-12-31",
            "source": "manual",
        },
    )

    assert upcoming_response.status_code == 201
    assert expired_response.status_code == 201
    assert far_future_response.status_code == 201

    response = client.get("/api/v1/products/deadline-reminders")

    assert response.status_code == 200

    payload = response.json()
    product_names = [item["product_name"] for item in payload]

    assert "Upcoming Return Product" in product_names
    assert "Expired Return Product" in product_names
    assert "Far Future Product" not in product_names

    reminder_pairs = {
        (item["product_name"], item["deadline_type"])
        for item in payload
    }

    assert ("Upcoming Return Product", "return") in reminder_pairs
    assert ("Upcoming Return Product", "warranty") in reminder_pairs
    assert ("Expired Return Product", "return") in reminder_pairs


def test_list_deadline_reminders_excludes_archived_products(
    client: TestClient,
) -> None:
    create_response = client.post(
        "/api/v1/products",
        json={
            "name": "Archived Reminder Product",
            "merchant": "Target",
            "return_deadline": "2026-05-28",
            "source": "manual",
        },
    )

    assert create_response.status_code == 201

    product_id = create_response.json()["id"]

    archive_response = client.post(f"/api/v1/products/{product_id}/archive")

    assert archive_response.status_code == 200

    response = client.get("/api/v1/products/deadline-reminders")

    assert response.status_code == 200

    product_names = [
        item["product_name"]
        for item in response.json()
    ]

    assert "Archived Reminder Product" not in product_names


def test_create_product_allows_support_metadata(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/products",
        json={
            "name": "Smart Speaker",
            "merchant": "Best Buy",
            "model_number": "SPK-2026",
            "serial_number": "SN123456789",
            "manual_url": "https://example.com/manual",
            "support_url": "https://example.com/support",
            "support_phone": "1-800-555-1234",
            "source": "manual",
        },
    )

    assert response.status_code == 201

    payload = response.json()

    assert payload["model_number"] == "SPK-2026"
    assert payload["serial_number"] == "SN123456789"
    assert payload["manual_url"] == "https://example.com/manual"
    assert payload["support_url"] == "https://example.com/support"
    assert payload["support_phone"] == "1-800-555-1234"


def test_update_product_allows_support_metadata(
    client: TestClient,
) -> None:
    create_response = client.post(
        "/api/v1/products",
        json={
            "name": "Router",
            "merchant": "Target",
            "source": "manual",
        },
    )

    assert create_response.status_code == 201

    product_id = create_response.json()["id"]

    update_response = client.patch(
        f"/api/v1/products/{product_id}",
        json={
            "model_number": "RTR-9000",
            "serial_number": "ROUTER-SN-001",
            "manual_url": "https://example.com/router-manual",
            "support_url": "https://example.com/router-support",
            "support_phone": "1-888-555-9999",
        },
    )

    assert update_response.status_code == 200

    payload = update_response.json()

    assert payload["model_number"] == "RTR-9000"
    assert payload["serial_number"] == "ROUTER-SN-001"
    assert payload["manual_url"] == "https://example.com/router-manual"
    assert payload["support_url"] == "https://example.com/router-support"
    assert payload["support_phone"] == "1-888-555-9999"
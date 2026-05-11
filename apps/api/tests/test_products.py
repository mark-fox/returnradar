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



from fastapi.testclient import TestClient

from app.core.config import settings


def test_health_check_does_not_require_demo_access_key(
    client: TestClient,
    monkeypatch,
) -> None:
    monkeypatch.setattr(settings, "returnradar_demo_access_key", "test-demo-key")

    response = client.get("/api/v1/health")

    assert response.status_code == 200


def test_protected_routes_require_demo_access_key_when_configured(
    client: TestClient,
    monkeypatch,
) -> None:
    monkeypatch.setattr(settings, "returnradar_demo_access_key", "test-demo-key")

    response = client.get("/api/v1/products")

    assert response.status_code == 401
    assert response.json()["detail"] == "Valid ReturnRadar demo access key required."


def test_protected_routes_accept_valid_demo_access_key(
    client: TestClient,
    monkeypatch,
) -> None:
    monkeypatch.setattr(settings, "returnradar_demo_access_key", "test-demo-key")

    response = client.get(
        "/api/v1/products",
        headers={
            "X-ReturnRadar-Demo-Key": "test-demo-key",
        },
    )

    assert response.status_code == 200


def test_protected_routes_work_normally_when_demo_key_is_not_configured(
    client: TestClient,
    monkeypatch,
) -> None:
    monkeypatch.setattr(settings, "returnradar_demo_access_key", None)

    response = client.get("/api/v1/products")

    assert response.status_code == 200
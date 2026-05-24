import pytest
from fastapi.testclient import TestClient
from app.db.session import SessionLocal
from app.models.product import Product

from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(autouse=True)
def clean_products_table():
    db = SessionLocal()

    try:
        db.query(Product).delete()
        db.commit()
        yield
    finally:
        db.query(Product).delete()
        db.commit()
        db.close()
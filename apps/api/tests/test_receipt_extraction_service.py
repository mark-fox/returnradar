import pytest

from app.core.config import settings
from app.services.receipt_extraction import (
    MockReceiptExtractor,
    OpenAIReceiptExtractor,
    build_receipt_extractor,
    extract_merchant,
    extract_price_cents,
    extract_product_name,
    extract_receipt_suggestion,
)


def test_extract_price_cents_uses_last_price_like_total() -> None:
    raw_text = (
        "BEST BUY\n"
        "Sony WH-1000XM5 Headphones\n"
        "Subtotal 399.99\n"
        "Tax 31.20\n"
        "Total 431.19\n"
        "VISA"
    )

    assert extract_price_cents(raw_text) == 43119


def test_extract_price_cents_returns_none_when_no_price_found() -> None:
    assert extract_price_cents("TARGET\nReusable Bag") is None


def test_extract_merchant_uses_first_non_empty_line() -> None:
    raw_text = "\n\nTARGET\nReusable Bag\nTotal 0.99"

    assert extract_merchant(raw_text) == "TARGET"


def test_extract_product_name_skips_receipt_summary_lines() -> None:
    raw_text = (
        "BEST BUY\n"
        "Subtotal 399.99\n"
        "Tax 31.20\n"
        "Sony WH-1000XM5 Headphones\n"
        "Total 431.19"
    )

    assert extract_product_name(raw_text) == "Sony WH-1000XM5 Headphones"


def test_extract_product_name_falls_back_to_unknown_product() -> None:
    assert extract_product_name("BEST BUY\nSubtotal 399.99\nTotal 431.19") == "Unknown product"


def test_extract_receipt_suggestion_returns_expected_contract() -> None:
    raw_text = (
        "BEST BUY\n"
        "Sony WH-1000XM5 Headphones\n"
        "Subtotal 399.99\n"
        "Tax 31.20\n"
        "Total 431.19\n"
        "VISA"
    )

    result = extract_receipt_suggestion(raw_text)

    assert result.source == "mock"
    assert result.confidence == 0.62
    assert result.suggestion.name == "Sony WH-1000XM5 Headphones"
    assert result.suggestion.merchant == "BEST BUY"
    assert result.suggestion.price_cents == 43119
    assert result.suggestion.currency == "USD"
    assert result.suggestion.purchase_date is not None
    assert result.suggestion.return_deadline is not None
    assert result.suggestion.warranty_deadline is not None
    assert result.warnings


def test_build_receipt_extractor_returns_mock_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "receipt_extractor_provider", "mock")

    extractor = build_receipt_extractor()

    assert isinstance(extractor, MockReceiptExtractor)


def test_build_receipt_extractor_rejects_unsupported_provider(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "receipt_extractor_provider", "unsupported")

    with pytest.raises(ValueError, match="Unsupported receipt extractor provider"):
        build_receipt_extractor()


def test_openai_receipt_extractor_requires_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "openai_api_key", None)

    with pytest.raises(ValueError, match="OPENAI_API_KEY is not configured"):
        OpenAIReceiptExtractor()


def test_build_receipt_extractor_returns_openai_provider(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "receipt_extractor_provider", "openai")
    monkeypatch.setattr(settings, "openai_api_key", "test-key")

    extractor = build_receipt_extractor()

    assert isinstance(extractor, OpenAIReceiptExtractor)
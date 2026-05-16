import base64
import json
import re
from datetime import date, timedelta
from typing import Protocol

from openai import OpenAI

from app.schemas.receipt_extraction import (
    ReceiptExtractionResponse,
    ReceiptLineItem,
    ReceiptProductSuggestion,
)
from app.core.config import settings


class ReceiptExtractor(Protocol):
    def extract(self, raw_text: str) -> ReceiptExtractionResponse:
        pass


def extract_price_cents(raw_text: str) -> int | None:
    price_matches = re.findall(r"\$?\b(\d+\.\d{2})\b", raw_text)

    if not price_matches:
        return None

    price_as_float = float(price_matches[-1])

    return round(price_as_float * 100)


def extract_merchant(raw_text: str) -> str | None:
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

    if not lines:
        return None

    return lines[0][:255]


def extract_product_name(raw_text: str) -> str:
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

    ignored_terms = ("subtotal", "tax", "total", "visa", "mastercard", "change")

    for line in lines[1:]:
        lower_line = line.lower()

        if any(term in lower_line for term in ignored_terms):
            continue

        if re.search(r"[A-Za-z]", line):
            return line[:255]

    return "Unknown product"


class MockReceiptExtractor:
    def extract(self, raw_text: str) -> ReceiptExtractionResponse:
        merchant = extract_merchant(raw_text)
        product_name = extract_product_name(raw_text)
        price_cents = extract_price_cents(raw_text)

        today = date.today()

        warnings = [
            "This is a mock extraction. User confirmation is required before saving.",
            "Return and warranty dates are estimates, not guarantees.",
        ]

        return ReceiptExtractionResponse(
            source="mock",
            confidence=0.62,
            suggestion=ReceiptProductSuggestion(
                name=product_name,
                merchant=merchant,
                purchase_date=today,
                return_deadline=today + timedelta(days=30),
                warranty_deadline=today + timedelta(days=365),
                price_cents=price_cents,
                currency="USD",
                notes="AI-suggested details. Verify against the receipt and retailer policy.",
            ),
            warnings=warnings,
            line_items=[
                ReceiptLineItem(
                    name=product_name,
                    price_cents=price_cents,
                )
            ],
        )


class OpenAIReceiptExtractor:
    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not configured")

        self.client = OpenAI(api_key=settings.openai_api_key)

    def extract(self, raw_text: str) -> ReceiptExtractionResponse:
        completion = self.client.chat.completions.create(
            model="gpt-4.1-mini",
            temperature=0,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You extract structured product purchase information from retail receipts. "
                        "You must return only valid JSON with no markdown or explanations. "
                        "Do not invent products that are not present in the receipt text. "
                        "Prefer actual product names over generic labels like 'item' or 'purchase'. "
                        "Use the merchant/store name when available. "
                        "price_cents must be an integer in cents. "
                        "currency should usually be USD unless another currency is clearly shown. "
                        "notes should briefly summarize useful receipt context if applicable."
                    ),
                },
                {
                    "role": "user",
                    "content": f"""
                Extract structured receipt information.

                Return ONLY JSON with these fields:
                {{
                "name": string,
                "merchant": string | null,
                  "line_items": [
    {
      "name": string,
      "price_cents": integer | null
    }
  ],
                "price_cents": integer | null,
                "currency": string,
                "notes": string | null
                }}

                Guidelines:
                - Focus on the primary purchased product.
                - Ignore subtotal/tax/visa/mastercard lines unless useful.
                - Use null when information is unclear.
                - Do not hallucinate missing details.

                Receipt text:
                {raw_text}
                """,
                },
            ],
        )

        response_text = completion.choices[0].message.content

        if not response_text:
            raise ValueError("OpenAI returned an empty response")

        try:
            parsed = json.loads(response_text)
        except json.JSONDecodeError as error:
            raise ValueError("OpenAI returned invalid JSON") from error

        today = date.today()

        return ReceiptExtractionResponse(
            source="openai",
            confidence=0.85,
            suggestion=ReceiptProductSuggestion(
                name=str(parsed.get("name") or "Unknown product"),
                merchant=str(parsed["merchant"]) if parsed.get("merchant") else None,
                purchase_date=today,
                return_deadline=today + timedelta(days=30),
                warranty_deadline=today + timedelta(days=365),
                price_cents=parsed.get("price_cents"),
                currency=str(parsed.get("currency") or "USD"),
                notes=str(parsed["notes"]) if parsed.get("notes") else None,
            ),
            line_items=[
                ReceiptLineItem(
                    name=str(item.get("name", "Unknown item")),
                    price_cents=item.get("price_cents"),
                )
                for item in parsed.get("line_items", [])
                if isinstance(item, dict)
            ],
            warnings=[
                "This is AI-generated data. Verify all extracted details before saving.",
                "Return and warranty dates are estimates, not guarantees.",
            ],
        )


    def extract_from_image(
        self,
        image_bytes: bytes,
    ) -> ReceiptExtractionResponse:
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")

        completion = self.client.chat.completions.create(
            model="gpt-4.1-mini",
            temperature=0,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You extract structured product purchase information "
                        "from retail receipt images. "
                        "Return only valid JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """
Extract structured receipt information from this receipt image.

Return ONLY valid JSON with this exact shape:
{
  "name": string,
  "merchant": string | null,
  "price_cents": integer | null,
  "currency": string,
  "notes": string | null,
  "line_items": [
    {
      "name": string,
      "price_cents": integer | null
    }
  ]
}

Rules:
- merchant should be the store name, such as Target or Best Buy.
- name should be the primary purchased product, not the store name, address, phone number, barcode, receipt number, or slogan.
- line_items must include all purchased products visible on the receipt.
- Do not include subtotal, tax, total, payment method, barcode, store address, or receipt numbers as line_items.
- price_cents must be an integer in cents, so $59.99 becomes 5999.
- If multiple products are visible, choose the most important or highest-priced product as name.
- Use null when a field is unclear.
- You must always include the line_items key. If no purchased products are detected, use an empty array.
- For this receipt, line_items should contain every purchased product row.
"""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{encoded_image}"
                            },
                        },
                    ],
                },
            ],
        )

        response_text = completion.choices[0].message.content

        if not response_text:
            raise ValueError("OpenAI returned an empty response")

        try:
            parsed = json.loads(response_text)
        except json.JSONDecodeError as error:
            raise ValueError(
                "OpenAI returned invalid JSON"
            ) from error

        today = date.today()
        line_items_source = parsed.get("line_items") or parsed.get("items") or []

        return ReceiptExtractionResponse(
            source="openai-vision",
            confidence=0.88,
            suggestion=ReceiptProductSuggestion(
                name=str(parsed.get("name") or "Unknown product"),
                merchant=(
                    str(parsed["merchant"])
                    if parsed.get("merchant")
                    else None
                ),
                purchase_date=today,
                return_deadline=today + timedelta(days=30),
                warranty_deadline=today + timedelta(days=365),
                price_cents=parsed.get("price_cents"),
                currency=str(parsed.get("currency") or "USD"),
                notes=(
                    str(parsed["notes"])
                    if parsed.get("notes")
                    else None
                ),
            ),
            warnings=[
                "This is AI-generated data from a receipt image.",
                "Verify all extracted information before saving.",
            ],
            line_items=[
                ReceiptLineItem(
                    name=str(item.get("name") or "Unknown item"),
                    price_cents=item.get("price_cents"),
                )
                for item in line_items_source
                if isinstance(item, dict)
            ],
        )
    

def build_receipt_extractor() -> ReceiptExtractor:
    if settings.receipt_extractor_provider == "mock":
        return MockReceiptExtractor()
    
    if settings.receipt_extractor_provider == "openai":
        return OpenAIReceiptExtractor()

    raise ValueError(
        f"Unsupported receipt extractor provider: {settings.receipt_extractor_provider}"
    )


default_receipt_extractor: ReceiptExtractor = build_receipt_extractor()


def extract_receipt_suggestion(raw_text: str) -> ReceiptExtractionResponse:
    return default_receipt_extractor.extract(raw_text)
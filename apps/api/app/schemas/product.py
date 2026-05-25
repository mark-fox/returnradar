from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    merchant: str | None = Field(default=None, max_length=255)

    purchase_date: date | None = None
    return_deadline: date | None = None
    warranty_deadline: date | None = None
    warranty_provider: str | None = Field(default=None, max_length=255)
    warranty_claim_url: str | None = Field(default=None, max_length=500)
    warranty_notes: str | None = None

    price_cents: int | None = Field(default=None, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)

    notes: str | None = None
    receipt_image_path: str | None = Field(default=None, max_length=500)
    source: Literal["manual", "receipt_ai"] = "manual"
    ai_provider: str | None = Field(default=None, max_length=100)
    ai_confidence: int | None = Field(default=None, ge=0, le=100)
    is_archived: bool = False


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    merchant: str | None = Field(default=None, max_length=255)

    purchase_date: date | None = None
    return_deadline: date | None = None
    warranty_deadline: date | None = None
    warranty_provider: str | None = Field(default=None, max_length=255)
    warranty_claim_url: str | None = Field(default=None, max_length=500)
    warranty_notes: str | None = None

    price_cents: int | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)

    notes: str | None = None
    receipt_image_path: str | None = Field(default=None, max_length=500)
    source: Literal["manual", "receipt_ai"] | None = None
    ai_provider: str | None = Field(default=None, max_length=100)
    ai_confidence: int | None = Field(default=None, ge=0, le=100)
    is_archived: bool | None = None


class ProductRead(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
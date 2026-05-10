from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    merchant: Optional[str] = Field(default=None, max_length=255)

    purchase_date: Optional[date] = None
    return_deadline: Optional[date] = None
    warranty_deadline: Optional[date] = None

    price_cents: Optional[int] = Field(default=None, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)

    notes: Optional[str] = None
    source: Literal["manual", "receipt_ai"] = "manual"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    merchant: Optional[str] = Field(default=None, max_length=255)

    purchase_date: Optional[date] = None
    return_deadline: Optional[date] = None
    warranty_deadline: Optional[date] = None

    price_cents: Optional[int] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3)

    notes: Optional[str] = None
    source: Optional[Literal["manual", "receipt_ai"]] = None


class ProductRead(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    merchant: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    purchase_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    return_deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    warranty_deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    price_cents: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    receipt_image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    source: Mapped[str] = mapped_column(String(50), nullable=False, default="manual")
    ai_provider: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ai_confidence: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    is_archived: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
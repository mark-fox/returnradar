"""add product support metadata

Revision ID: 2a103095234f
Revises: b5a462f09674
Create Date: 2026-05-30 17:33:58.478410

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2a103095234f'
down_revision: Union[str, Sequence[str], None] = 'b5a462f09674'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("products", sa.Column("model_number", sa.String(length=255), nullable=True))
    op.add_column("products", sa.Column("serial_number", sa.String(length=255), nullable=True))
    op.add_column("products", sa.Column("manual_url", sa.String(length=500), nullable=True))
    op.add_column("products", sa.Column("support_url", sa.String(length=500), nullable=True))
    op.add_column("products", sa.Column("support_phone", sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "support_phone")
    op.drop_column("products", "support_url")
    op.drop_column("products", "manual_url")
    op.drop_column("products", "serial_number")
    op.drop_column("products", "model_number")

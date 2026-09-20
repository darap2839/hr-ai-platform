"""add organization unit profile

Revision ID: 2026_09_19_1500_e1f2a3b4c5d6
Revises: 2026_09_19_1300_d0e1f2a3b4c5
Create Date: 2026-09-19 15:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2026_09_19_1500_e1f2a3b4c5d6"
down_revision: Union[str, None] = "2026_09_19_1300_d0e1f2a3b4c5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("organization_units", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("organization_units", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column("organization_units", sa.Column("phone", sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column("organization_units", "phone")
    op.drop_column("organization_units", "email")
    op.drop_column("organization_units", "description")

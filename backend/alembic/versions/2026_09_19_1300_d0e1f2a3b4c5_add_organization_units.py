"""add organization units

Revision ID: 2026_09_19_1300_d0e1f2a3b4c5
Revises: 2026_09_19_1000_c9d0e1f2a3b4
Create Date: 2026-09-19 13:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "2026_09_19_1300_d0e1f2a3b4c5"
down_revision: Union[str, None] = "2026_09_19_1000_c9d0e1f2a3b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "organization_units",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("code", sa.String(length=100), nullable=True),
        sa.Column("unit_type", sa.String(length=50), nullable=False),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column(
            "sort_order",
            sa.Integer(),
            server_default=sa.text("0"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.CheckConstraint(
            "unit_type IN ('company', 'directorate', 'department', 'team')",
            name="ck_organization_units_type",
        ),
        sa.ForeignKeyConstraint(
            ["parent_id"],
            ["organization_units.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_organization_units_id"), "organization_units", ["id"])
    op.create_index(op.f("ix_organization_units_name"), "organization_units", ["name"])
    op.create_index(
        op.f("ix_organization_units_code"),
        "organization_units",
        ["code"],
        unique=True,
    )
    op.create_index(
        op.f("ix_organization_units_unit_type"),
        "organization_units",
        ["unit_type"],
    )
    op.create_index(
        op.f("ix_organization_units_parent_id"),
        "organization_units",
        ["parent_id"],
    )
    op.create_index(
        op.f("ix_organization_units_is_active"),
        "organization_units",
        ["is_active"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_organization_units_is_active"), table_name="organization_units")
    op.drop_index(op.f("ix_organization_units_parent_id"), table_name="organization_units")
    op.drop_index(op.f("ix_organization_units_unit_type"), table_name="organization_units")
    op.drop_index(op.f("ix_organization_units_code"), table_name="organization_units")
    op.drop_index(op.f("ix_organization_units_name"), table_name="organization_units")
    op.drop_index(op.f("ix_organization_units_id"), table_name="organization_units")
    op.drop_table("organization_units")

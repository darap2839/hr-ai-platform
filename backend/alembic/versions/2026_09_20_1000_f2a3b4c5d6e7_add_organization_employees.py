"""add organization employees

Revision ID: 2026_09_20_1000_f2a3b4c5d6e7
Revises: 2026_09_19_1500_e1f2a3b4c5d6
Create Date: 2026-09-20 10:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2026_09_20_1000_f2a3b4c5d6e7"
down_revision: Union[str, None] = "2026_09_19_1500_e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "organization_employees",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("position", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("is_manager", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["unit_id"], ["organization_units.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_organization_employees_id"), "organization_employees", ["id"], unique=False)
    op.create_index(op.f("ix_organization_employees_unit_id"), "organization_employees", ["unit_id"], unique=False)
    op.create_index(op.f("ix_organization_employees_full_name"), "organization_employees", ["full_name"], unique=False)
    op.create_index(op.f("ix_organization_employees_is_manager"), "organization_employees", ["is_manager"], unique=False)
    op.create_index(op.f("ix_organization_employees_is_active"), "organization_employees", ["is_active"], unique=False)
    op.create_index(
        "uq_organization_employees_active_manager",
        "organization_employees",
        ["unit_id"],
        unique=True,
        postgresql_where=sa.text("is_manager = true AND is_active = true"),
    )


def downgrade() -> None:
    op.drop_index("uq_organization_employees_active_manager", table_name="organization_employees")
    op.drop_index(op.f("ix_organization_employees_is_active"), table_name="organization_employees")
    op.drop_index(op.f("ix_organization_employees_is_manager"), table_name="organization_employees")
    op.drop_index(op.f("ix_organization_employees_full_name"), table_name="organization_employees")
    op.drop_index(op.f("ix_organization_employees_unit_id"), table_name="organization_employees")
    op.drop_index(op.f("ix_organization_employees_id"), table_name="organization_employees")
    op.drop_table("organization_employees")

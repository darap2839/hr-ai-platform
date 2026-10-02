"""add manager relation to organization employees

Revision ID: 2026_10_02_1325
Revises: 2026_09_20_1000_f2a3b4c5d6e7
Create Date: 2026-10-02 13:25:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2026_10_02_1325"
down_revision: Union[str, None] = "2026_09_20_1000_f2a3b4c5d6e7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "organization_employees",
        sa.Column("manager_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        "ix_organization_employees_manager_id",
        "organization_employees",
        ["manager_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_organization_employees_manager_id",
        "organization_employees",
        "organization_employees",
        ["manager_id"],
        ["id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_organization_employees_manager_id",
        "organization_employees",
        type_="foreignkey",
    )
    op.drop_index(
        "ix_organization_employees_manager_id",
        table_name="organization_employees",
    )
    op.drop_column("organization_employees", "manager_id")

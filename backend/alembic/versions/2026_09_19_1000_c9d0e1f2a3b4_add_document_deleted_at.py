"""add deletion timestamp to documents

Revision ID: 2026_09_19_1000_c9d0e1f2a3b4
Revises: 2026_09_07_1330_b8c9d0e1f2a3
Create Date: 2026-09-19 10:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "2026_09_19_1000_c9d0e1f2a3b4"
down_revision: Union[str, None] = "2026_09_07_1330_b8c9d0e1f2a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "documents",
        sa.Column(
            "deleted_at",
            postgresql.TIMESTAMP(timezone=True),
            nullable=True,
        ),
    )
    op.execute(
        """
        UPDATE documents
        SET deleted_at = COALESCE(updated_at, created_at, now())
        WHERE is_deleted = true AND deleted_at IS NULL
        """
    )
    op.create_index(
        op.f("ix_documents_deleted_at"),
        "documents",
        ["deleted_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_documents_deleted_at"), table_name="documents")
    op.drop_column("documents", "deleted_at")

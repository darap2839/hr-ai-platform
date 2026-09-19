"""Periodic cleanup for knowledge-base documents kept in the trash."""

import asyncio
import logging
import os
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.db_models import DocumentModel
from app.services.minio_service import minio_service


logger = logging.getLogger(__name__)
TRASH_RETENTION_DAYS = 30
DEFAULT_CLEANUP_INTERVAL_SECONDS = 24 * 60 * 60


def purge_expired_documents(
    db: Session,
    now: datetime | None = None,
    retention_days: int = TRASH_RETENTION_DAYS,
) -> dict[str, int]:
    """Delete expired trash records and their source files."""
    cleanup_time = now or datetime.now(timezone.utc)
    cutoff = cleanup_time - timedelta(days=retention_days)
    documents = (
        db.query(DocumentModel)
        .filter(
            DocumentModel.is_deleted == True,
            DocumentModel.deleted_at.isnot(None),
            DocumentModel.deleted_at <= cutoff,
        )
        .with_for_update(skip_locked=True)
        .all()
    )

    deleted = 0
    failed = 0
    for document in documents:
        if document.file_path and not minio_service.delete_file(document.file_path):
            failed += 1
            logger.warning(
                "Could not remove file for expired document %s",
                document.id,
            )
            continue
        db.delete(document)
        deleted += 1

    if deleted:
        db.commit()
    return {"deleted": deleted, "failed": failed}


def run_trash_cleanup() -> dict[str, int]:
    """Run one cleanup iteration in an isolated database session."""
    db = SessionLocal()
    try:
        result = purge_expired_documents(db)
        logger.info(
            "Trash cleanup completed: deleted=%s failed=%s",
            result["deleted"],
            result["failed"],
        )
        return result
    except Exception:
        db.rollback()
        logger.exception("Trash cleanup failed")
        return {"deleted": 0, "failed": 1}
    finally:
        db.close()


async def trash_cleanup_loop() -> None:
    """Run cleanup at startup and then once per configured interval."""
    interval = max(
        60,
        int(os.getenv("TRASH_CLEANUP_INTERVAL_SECONDS", DEFAULT_CLEANUP_INTERVAL_SECONDS)),
    )
    while True:
        await asyncio.to_thread(run_trash_cleanup)
        await asyncio.sleep(interval)

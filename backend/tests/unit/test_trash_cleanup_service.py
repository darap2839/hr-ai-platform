from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from app.services.trash_cleanup_service import purge_expired_documents


def test_purge_expired_documents_deletes_available_files_and_keeps_failures():
    removable = MagicMock(id=1, file_path="documents/removable.pdf")
    unavailable = MagicMock(id=2, file_path="documents/unavailable.pdf")
    query = MagicMock()
    query.filter.return_value = query
    query.with_for_update.return_value = query
    query.all.return_value = [removable, unavailable]
    db = MagicMock()
    db.query.return_value = query

    with patch(
        "app.services.trash_cleanup_service.minio_service.delete_file",
        side_effect=[True, False],
    ) as delete_file:
        result = purge_expired_documents(
            db,
            now=datetime(2026, 9, 19, tzinfo=timezone.utc),
        )

    assert result == {"deleted": 1, "failed": 1}
    assert delete_file.call_count == 2
    query.with_for_update.assert_called_once_with(skip_locked=True)
    db.delete.assert_called_once_with(removable)
    db.commit.assert_called_once()


def test_purge_expired_documents_does_not_commit_when_nothing_expired():
    query = MagicMock()
    query.filter.return_value = query
    query.with_for_update.return_value = query
    query.all.return_value = []
    db = MagicMock()
    db.query.return_value = query

    result = purge_expired_documents(db)

    assert result == {"deleted": 0, "failed": 0}
    db.delete.assert_not_called()
    db.commit.assert_not_called()

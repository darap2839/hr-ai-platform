from unittest.mock import MagicMock, patch

import pytest

from app.api.documents import list_documents


@pytest.mark.parametrize(
    ("archived", "expected_operator"),
    [(False, "ne"), (True, "eq")],
)
def test_list_documents_applies_archive_scope(archived, expected_operator):
    query = MagicMock()
    query.filter.return_value = query
    query.offset.return_value = query
    query.limit.return_value = query
    query.all.return_value = []
    db = MagicMock()
    db.query.return_value = query

    with patch("app.api.documents.minio_service.file_exists"):
        result = list_documents(archived=archived, db=db)

    assert result == []
    archive_expression = query.filter.call_args_list[1].args[0]
    assert archive_expression.operator.__name__ == expected_operator
    assert archive_expression.right.value == "archived"

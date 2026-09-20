from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.api.organization import (
    build_organization_tree,
    deactivate_organization_unit,
    validate_parent,
)


def make_unit(unit_id, name, parent_id=None, sort_order=0, is_active=True):
    return SimpleNamespace(
        id=unit_id,
        name=name,
        code=None,
        description=None,
        email=None,
        phone=None,
        unit_type="department",
        parent_id=parent_id,
        is_active=is_active,
        sort_order=sort_order,
        created_at=datetime(2026, 9, 19, tzinfo=timezone.utc),
        updated_at=None,
        parent=None,
    )


def test_build_organization_tree_nests_children_under_parent():
    company = make_unit(1, "Компания")
    department = make_unit(2, "HR", parent_id=1)

    result = build_organization_tree([company, department])

    assert len(result) == 1
    assert result[0]["name"] == "Компания"
    assert result[0]["children"][0]["name"] == "HR"


def test_build_organization_tree_includes_department_profile():
    department = make_unit(1, "HR")
    department.description = "Подбор и развитие сотрудников"
    department.email = "hr@example.com"
    department.phone = "+7 900 000-00-00"

    result = build_organization_tree([department])

    assert result[0]["description"] == "Подбор и развитие сотрудников"
    assert result[0]["email"] == "hr@example.com"
    assert result[0]["phone"] == "+7 900 000-00-00"


def test_validate_parent_rejects_self_reference():
    with pytest.raises(HTTPException) as error:
        validate_parent(MagicMock(), parent_id=7, unit_id=7)

    assert error.value.status_code == 400


def test_validate_parent_rejects_descendant_as_parent():
    current_unit = make_unit(7, "Текущий отдел")
    descendant = make_unit(8, "Дочерняя команда", parent_id=7)
    descendant.parent = current_unit
    query = MagicMock()
    query.filter.return_value = query
    query.first.return_value = descendant
    db = MagicMock()
    db.query.return_value = query

    with pytest.raises(HTTPException) as error:
        validate_parent(db, parent_id=descendant.id, unit_id=current_unit.id)

    assert error.value.status_code == 400


def test_deactivate_organization_unit_rejects_active_children():
    unit = make_unit(1, "Компания")
    child = make_unit(2, "HR", parent_id=1)
    unit_query = MagicMock()
    unit_query.filter.return_value = unit_query
    unit_query.first.return_value = unit
    child_query = MagicMock()
    child_query.filter.return_value = child_query
    child_query.first.return_value = child
    db = MagicMock()
    db.query.side_effect = [unit_query, child_query]

    with pytest.raises(HTTPException) as error:
        deactivate_organization_unit(unit_id=unit.id, db=db)

    assert error.value.status_code == 409
    db.commit.assert_not_called()

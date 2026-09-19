"""Organization structure API."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import OrganizationUnitModel
from app.schemas.organization import (
    OrganizationUnitCreate,
    OrganizationUnitResponse,
    OrganizationUnitUpdate,
)


router = APIRouter(prefix="/organization", tags=["Organization"])


def build_organization_tree(units: list[OrganizationUnitModel]) -> list[dict]:
    """Build a nested response without relying on recursive lazy loading."""
    nodes = {
        unit.id: {
            "id": unit.id,
            "name": unit.name,
            "code": unit.code,
            "unit_type": unit.unit_type,
            "parent_id": unit.parent_id,
            "is_active": unit.is_active,
            "sort_order": unit.sort_order,
            "created_at": unit.created_at,
            "updated_at": unit.updated_at,
            "children": [],
        }
        for unit in units
    }
    roots = []
    for unit in units:
        node = nodes[unit.id]
        parent = nodes.get(unit.parent_id)
        if parent:
            parent["children"].append(node)
        else:
            roots.append(node)
    return roots


def validate_parent(
    db: Session,
    parent_id: int | None,
    unit_id: int | None = None,
) -> OrganizationUnitModel | None:
    """Validate parent existence and prevent cycles."""
    if parent_id is None:
        return None
    if unit_id is not None and parent_id == unit_id:
        raise HTTPException(status_code=400, detail="Подразделение не может быть родителем само себе")

    parent = db.query(OrganizationUnitModel).filter(
        OrganizationUnitModel.id == parent_id,
        OrganizationUnitModel.is_active == True,
    ).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent organization unit not found")

    ancestor = parent
    while ancestor is not None:
        if unit_id is not None and ancestor.id == unit_id:
            raise HTTPException(status_code=400, detail="Нельзя создать цикл в оргструктуре")
        ancestor = ancestor.parent
    return parent


@router.get("/units", response_model=List[OrganizationUnitResponse])
def list_organization_units(
    include_inactive: bool = Query(False),
    db: Session = Depends(get_db),
):
    query = db.query(OrganizationUnitModel)
    if not include_inactive:
        query = query.filter(OrganizationUnitModel.is_active == True)
    units = query.order_by(
        OrganizationUnitModel.sort_order,
        OrganizationUnitModel.name,
    ).all()
    return build_organization_tree(units)


@router.post("/units", response_model=OrganizationUnitResponse, status_code=201)
def create_organization_unit(
    payload: OrganizationUnitCreate,
    db: Session = Depends(get_db),
):
    validate_parent(db, payload.parent_id)
    unit = OrganizationUnitModel(**payload.model_dump())
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit


@router.put("/units/{unit_id}", response_model=OrganizationUnitResponse)
def update_organization_unit(
    unit_id: int,
    payload: OrganizationUnitUpdate,
    db: Session = Depends(get_db),
):
    unit = db.query(OrganizationUnitModel).filter(
        OrganizationUnitModel.id == unit_id,
    ).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Organization unit not found")

    changes = payload.model_dump(exclude_unset=True)
    if "parent_id" in changes:
        validate_parent(db, changes["parent_id"], unit_id=unit.id)
    for field, value in changes.items():
        setattr(unit, field, value)
    db.commit()
    db.refresh(unit)
    return unit


@router.delete("/units/{unit_id}", response_model=OrganizationUnitResponse)
def deactivate_organization_unit(unit_id: int, db: Session = Depends(get_db)):
    unit = db.query(OrganizationUnitModel).filter(
        OrganizationUnitModel.id == unit_id,
        OrganizationUnitModel.is_active == True,
    ).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Organization unit not found")

    active_child = db.query(OrganizationUnitModel).filter(
        OrganizationUnitModel.parent_id == unit_id,
        OrganizationUnitModel.is_active == True,
    ).first()
    if active_child:
        raise HTTPException(
            status_code=409,
            detail="Сначала отключите дочерние подразделения",
        )

    unit.is_active = False
    db.commit()
    db.refresh(unit)
    return unit

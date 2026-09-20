"""Organization structure API."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import OrganizationEmployeeModel, OrganizationUnitModel
from app.schemas.organization import (
    OrganizationEmployeeCreate,
    OrganizationEmployeeResponse,
    OrganizationEmployeeUpdate,
    OrganizationUnitCreate,
    OrganizationUnitResponse,
    OrganizationUnitUpdate,
)


router = APIRouter(prefix="/organization", tags=["Organization"])


def get_active_unit(db: Session, unit_id: int) -> OrganizationUnitModel:
    unit = db.query(OrganizationUnitModel).filter(
        OrganizationUnitModel.id == unit_id,
        OrganizationUnitModel.is_active == True,
    ).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Organization unit not found")
    return unit


def clear_unit_manager(db: Session, unit_id: int, exclude_id: int | None = None) -> None:
    query = db.query(OrganizationEmployeeModel).filter(
        OrganizationEmployeeModel.unit_id == unit_id,
        OrganizationEmployeeModel.is_manager == True,
        OrganizationEmployeeModel.is_active == True,
    )
    if exclude_id is not None:
        query = query.filter(OrganizationEmployeeModel.id != exclude_id)
    query.update({OrganizationEmployeeModel.is_manager: False}, synchronize_session=False)


def build_organization_tree(units: list[OrganizationUnitModel]) -> list[dict]:
    """Build a nested response without relying on recursive lazy loading."""
    nodes = {
        unit.id: {
            "id": unit.id,
            "name": unit.name,
            "code": unit.code,
            "description": unit.description,
            "email": unit.email,
            "phone": unit.phone,
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


@router.get(
    "/units/{unit_id}/employees",
    response_model=List[OrganizationEmployeeResponse],
)
def list_organization_employees(
    unit_id: int,
    include_inactive: bool = Query(False),
    db: Session = Depends(get_db),
):
    get_active_unit(db, unit_id)
    query = db.query(OrganizationEmployeeModel).filter(
        OrganizationEmployeeModel.unit_id == unit_id,
    )
    if not include_inactive:
        query = query.filter(OrganizationEmployeeModel.is_active == True)
    return query.order_by(
        OrganizationEmployeeModel.is_manager.desc(),
        OrganizationEmployeeModel.full_name,
    ).all()


@router.post(
    "/units/{unit_id}/employees",
    response_model=OrganizationEmployeeResponse,
    status_code=201,
)
def create_organization_employee(
    unit_id: int,
    payload: OrganizationEmployeeCreate,
    db: Session = Depends(get_db),
):
    get_active_unit(db, unit_id)
    if payload.is_manager:
        clear_unit_manager(db, unit_id)
    employee = OrganizationEmployeeModel(unit_id=unit_id, **payload.model_dump())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.put(
    "/employees/{employee_id}",
    response_model=OrganizationEmployeeResponse,
)
def update_organization_employee(
    employee_id: int,
    payload: OrganizationEmployeeUpdate,
    db: Session = Depends(get_db),
):
    employee = db.query(OrganizationEmployeeModel).filter(
        OrganizationEmployeeModel.id == employee_id,
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Organization employee not found")

    changes = payload.model_dump(exclude_unset=True)
    target_unit_id = changes.get("unit_id", employee.unit_id)
    if target_unit_id != employee.unit_id:
        get_active_unit(db, target_unit_id)
    if changes.get("is_manager", employee.is_manager):
        clear_unit_manager(db, target_unit_id, exclude_id=employee.id)
    for field, value in changes.items():
        setattr(employee, field, value)
    db.commit()
    db.refresh(employee)
    return employee


@router.delete(
    "/employees/{employee_id}",
    response_model=OrganizationEmployeeResponse,
)
def deactivate_organization_employee(
    employee_id: int,
    db: Session = Depends(get_db),
):
    employee = db.query(OrganizationEmployeeModel).filter(
        OrganizationEmployeeModel.id == employee_id,
        OrganizationEmployeeModel.is_active == True,
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Organization employee not found")
    employee.is_active = False
    employee.is_manager = False
    db.commit()
    db.refresh(employee)
    return employee

"""Schemas for the organization structure."""

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


OrganizationUnitType = Literal["company", "directorate", "department", "team"]


class OrganizationUnitBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    code: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    unit_type: OrganizationUnitType = "department"
    parent_id: Optional[int] = None
    sort_order: int = 0


class OrganizationUnitCreate(OrganizationUnitBase):
    pass


class OrganizationUnitUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    code: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    unit_type: Optional[OrganizationUnitType] = None
    parent_id: Optional[int] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class OrganizationUnitResponse(OrganizationUnitBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    children: List["OrganizationUnitResponse"] = Field(default_factory=list)

    class Config:
        from_attributes = True


OrganizationUnitResponse.model_rebuild()

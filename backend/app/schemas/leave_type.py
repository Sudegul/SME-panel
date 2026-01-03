from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from ..models.leave_type import GenderRestriction


class LeaveTypeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    max_days: int = Field(..., gt=0)
    is_paid: bool = True
    is_active: bool = True
    is_cumulative: bool = True
    gender_restriction: GenderRestriction = GenderRestriction.NONE
    description: Optional[str] = None


class LeaveTypeCreate(LeaveTypeBase):
    pass


class LeaveTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    max_days: Optional[int] = Field(None, gt=0)
    is_paid: Optional[bool] = None
    is_active: Optional[bool] = None
    is_cumulative: Optional[bool] = None
    gender_restriction: Optional[GenderRestriction] = None
    description: Optional[str] = None


class LeaveTypeResponse(LeaveTypeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

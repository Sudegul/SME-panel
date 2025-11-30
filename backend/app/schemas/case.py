from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.case import CaseStatus


class CaseBase(BaseModel):
    doctor_id: int
    title: str
    description: Optional[str] = None
    status: CaseStatus = CaseStatus.OPEN
    priority: Optional[str] = None


class CaseCreate(CaseBase):
    pass


class CaseUpdate(BaseModel):
    doctor_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CaseStatus] = None
    priority: Optional[str] = None
    resolved_at: Optional[datetime] = None


class CaseResponse(CaseBase):
    id: int
    employee_id: int
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.visit import VisitType


class VisitBase(BaseModel):
    visit_type: VisitType
    doctor_id: Optional[int] = None
    pharmacy_id: Optional[int] = None
    visit_date: datetime
    notes: Optional[str] = None
    products_presented: Optional[str] = None


class VisitCreate(VisitBase):
    pass


class VisitUpdate(BaseModel):
    visit_type: Optional[VisitType] = None
    doctor_id: Optional[int] = None
    pharmacy_id: Optional[int] = None
    visit_date: Optional[datetime] = None
    notes: Optional[str] = None
    products_presented: Optional[str] = None


class VisitResponse(VisitBase):
    id: int
    employee_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

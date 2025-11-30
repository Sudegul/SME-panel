from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date
from ..models.employee import EmployeeRole


class EmployeeBase(BaseModel):
    email: EmailStr
    full_name: str
    role: EmployeeRole = EmployeeRole.EMPLOYEE
    phone: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    password: str
    hire_date: Optional[date] = None


class EmployeeUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[EmployeeRole] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    hire_date: Optional[date] = None


class EmployeeResponse(EmployeeBase):
    id: int
    is_active: bool
    hire_date: Optional[date] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

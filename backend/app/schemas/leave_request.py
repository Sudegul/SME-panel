from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date, datetime
from ..models.leave_request import LeaveRequestStatus


class LeaveRequestBase(BaseModel):
    leave_type_id: int
    start_date: date
    end_date: date
    return_to_work_date: date
    total_days: int = Field(..., gt=0)
    message: Optional[str] = None

    @field_validator('end_date')
    @classmethod
    def end_date_must_be_after_start_date(cls, v, info):
        if 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError('end_date must be >= start_date')
        return v

    @field_validator('return_to_work_date')
    @classmethod
    def return_date_must_be_after_end_date(cls, v, info):
        if 'end_date' in info.data and v <= info.data['end_date']:
            raise ValueError('return_to_work_date must be > end_date')
        return v


class LeaveRequestCreate(LeaveRequestBase):
    pass


class LeaveRequestUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    return_to_work_date: Optional[date] = None
    total_days: Optional[int] = Field(None, gt=0)
    message: Optional[str] = None


class LeaveRequestApprove(BaseModel):
    approved: bool  # True = onay, False = red
    rejection_reason: Optional[str] = None  # Red durumunda zorunlu


class LeaveRequestResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    leave_type_id: int
    leave_type_name: str
    start_date: date
    end_date: date
    return_to_work_date: date
    total_days: int
    status: LeaveRequestStatus
    message: Optional[str]
    rejection_reason: Optional[str]
    approved_by: Optional[int]
    approver_name: Optional[str]
    approved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

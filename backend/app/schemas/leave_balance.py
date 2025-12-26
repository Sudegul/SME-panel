from pydantic import BaseModel
from datetime import datetime


class LeaveBalanceResponse(BaseModel):
    id: int
    employee_id: int
    leave_type_id: int
    leave_type_name: str
    year: int
    total_days: int
    used_days: int
    remaining_days: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

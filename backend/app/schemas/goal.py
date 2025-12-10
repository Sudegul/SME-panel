from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


class GoalBase(BaseModel):
    period: str  # 'monthly', 'quarterly', 'yearly'
    start_date: date
    end_date: date
    target_visits: int = 0
    target_sales: Decimal = Decimal('0.00')


class GoalCreate(GoalBase):
    employee_id: int


class GoalUpdate(BaseModel):
    period: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    target_visits: Optional[int] = None
    target_sales: Optional[Decimal] = None


class GoalResponse(GoalBase):
    id: int
    employee_id: int
    created_at: datetime

    class Config:
        from_attributes = True

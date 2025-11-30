from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.goal import GoalType


class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    goal_type: GoalType
    target_value: float
    start_date: datetime
    end_date: datetime


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    goal_type: Optional[GoalType] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_completed: Optional[bool] = None


class GoalResponse(GoalBase):
    id: int
    employee_id: int
    current_value: float
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

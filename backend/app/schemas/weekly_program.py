from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date


class HospitalVisitPlan(BaseModel):
    """Hastane ziyaret planı"""
    hospital_name: str


class DayPlan(BaseModel):
    """Günlük plan"""
    date: str  # ISO format: 2025-12-08
    day_name: str  # Pazartesi, Salı, etc.
    visits: List[HospitalVisitPlan]


class WeeklyProgramBase(BaseModel):
    """Haftalık program base"""
    week_start: date
    week_end: date
    days: List[DayPlan]


class WeeklyProgramCreate(WeeklyProgramBase):
    """Haftalık program oluşturma"""
    pass


class WeeklyProgramResponse(BaseModel):
    """Haftalık program response"""
    id: int
    employee_id: int
    employee_name: str
    week_start: date
    week_end: date
    days: List[DayPlan]
    submitted: bool
    submitted_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

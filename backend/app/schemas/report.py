from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class DailyReportBase(BaseModel):
    report_date: date
    summary: Optional[str] = None
    challenges: Optional[str] = None
    achievements: Optional[str] = None


class DailyReportCreate(DailyReportBase):
    pass


class DailyReportUpdate(BaseModel):
    report_date: Optional[date] = None
    total_visits: Optional[int] = None
    total_sales: Optional[int] = None
    summary: Optional[str] = None
    challenges: Optional[str] = None
    achievements: Optional[str] = None


class DailyReportResponse(DailyReportBase):
    id: int
    employee_id: int
    total_visits: int
    total_sales: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

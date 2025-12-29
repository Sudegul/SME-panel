from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Date
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class DailyReport(Base):
    __tablename__ = "daily_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_date = Column(Date, nullable=False, index=True, unique=True)
    total_visits = Column(Integer, default=0)
    total_sales = Column(Float, default=0.0)
    top_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    open_cases_count = Column(Integer, default=0)
    summary_json = Column(JSONB, nullable=True)  # JSON formatında detaylı rapor
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    top_employee = relationship("Employee")

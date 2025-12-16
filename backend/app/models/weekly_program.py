from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Boolean, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class WeeklyProgram(Base):
    """Haftalık çalışma programı - Hangi hafta, hangi hastanelere, hangi doktorlara gidilecek"""
    __tablename__ = "demo_weekly_programs"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("demo_employees.id"), nullable=False, index=True)
    week_start = Column(Date, nullable=False, index=True)  # Haftanın ilk günü (Pazartesi)
    week_end = Column(Date, nullable=False)  # Haftanın son günü (Pazar)

    # Haftalık program JSON formatında: {day: "2025-12-08", day_name: "Pazartesi", visits: [{hospital_name: "..."}]}
    days_json = Column(JSONB, nullable=False)

    submitted = Column(Boolean, default=True)
    submitted_at = Column(DateTime, nullable=True)  # Ne zaman gönderildi
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="weekly_programs")

    def __repr__(self):
        return f"<WeeklyProgram {self.employee_id} - {self.week_start} to {self.week_end}>"

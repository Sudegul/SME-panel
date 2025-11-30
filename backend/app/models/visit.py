from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class VisitType(str, enum.Enum):
    DOCTOR = "DOCTOR"
    PHARMACY = "PHARMACY"


class Visit(Base):
    __tablename__ = "demo_visits"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("demo_employees.id"), nullable=False)
    visit_type = Column(Enum(VisitType), nullable=False)
    target_id = Column(Integer, nullable=False)  # doctor_id veya pharmacy_id
    visit_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=True)  # Ziyaret süresi (dakika)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="visits")
    sales = relationship("Sale", back_populates="visit")

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class CaseType(str, enum.Enum):
    PRODUCT_ISSUE = "PRODUCT_ISSUE"
    CUSTOMER_COMPLAINT = "CUSTOMER_COMPLAINT"
    VISIT_PROBLEM = "VISIT_PROBLEM"
    OTHER = "OTHER"


class CasePriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class CaseStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    CLOSED = "CLOSED"


class Case(Base):
    __tablename__ = "demo_cases"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("demo_employees.id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("demo_visits.id"), nullable=True)  # İlgili ziyaret
    case_type = Column(Enum(CaseType), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Enum(CasePriority), default=CasePriority.MEDIUM)
    status = Column(Enum(CaseStatus), default=CaseStatus.OPEN)
    closed_by = Column(Integer, ForeignKey("demo_employees.id"), nullable=True)  # Kimin tarafından kapatıldı
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", foreign_keys=[employee_id], back_populates="cases")
    closer = relationship("Employee", foreign_keys=[closed_by])
    visit = relationship("Visit")
    comments = relationship("CaseComment", back_populates="case")

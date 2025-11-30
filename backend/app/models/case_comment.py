from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class CaseComment(Base):
    __tablename__ = "demo_case_comments"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("demo_cases.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("demo_employees.id"), nullable=False)
    comment = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)  # Dahili yorum mu?
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    case = relationship("Case", back_populates="comments")
    employee = relationship("Employee")

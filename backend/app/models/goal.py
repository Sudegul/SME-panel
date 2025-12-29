from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String, Date, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    period = Column(String, nullable=False)  # 'monthly', 'quarterly', 'yearly'
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    target_visits = Column(Integer, default=0)
    target_sales = Column(Numeric(12, 2), default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="goals")

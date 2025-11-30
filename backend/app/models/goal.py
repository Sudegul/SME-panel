from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Enum, Date
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class GoalType(str, enum.Enum):
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    YEARLY = "YEARLY"


class Goal(Base):
    __tablename__ = "demo_goals"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("demo_employees.id"), nullable=False)
    goal_type = Column(Enum(GoalType), nullable=False)
    target_visits = Column(Integer, nullable=False)  # Hedef ziyaret sayısı
    target_sales = Column(Float, nullable=False)  # Hedef satış tutarı
    period_start = Column(Date, nullable=False)  # Dönem başlangıcı
    period_end = Column(Date, nullable=False)  # Dönem bitişi
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="goals")

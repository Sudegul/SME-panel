from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Date
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class EmployeeRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"


class Employee(Base):
    __tablename__ = "demo_employees"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)  # Demo veride 'password_hash' olarak geçiyor
    role = Column(Enum(EmployeeRole), default=EmployeeRole.EMPLOYEE)
    phone = Column(String, nullable=True)
    hire_date = Column(Date, nullable=True)  # İşe giriş tarihi
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    visits = relationship("Visit", back_populates="employee")
    sales = relationship("Sale", back_populates="employee")
    cases = relationship("Case", foreign_keys="Case.employee_id", back_populates="employee")
    goals = relationship("Goal", back_populates="employee")

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Date, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class EmployeeRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"


class Gender(str, enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"


class Employee(Base):
    __tablename__ = "demo_employees"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(EmployeeRole), default=EmployeeRole.EMPLOYEE)
    phone = Column(String, nullable=True)
    gender = Column(Enum(Gender), nullable=True)
    hire_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)

    # Permissions (JSON field for granular access control)
    # Format: {
    #   "view_all_leaves": false,
    #   "view_all_daily_reports": false,
    #   "view_all_weekly_plans": false,
    #   "approve_leaves": false,
    #   "manage_leave_types": false,
    #   "manage_roles": false,
    #   "manage_performance_scale": false,
    #   "dashboard_full_access": false
    # }
    permissions = Column(JSON, nullable=True, default=None)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sales = relationship("Sale", back_populates="employee")
    goals = relationship("Goal", back_populates="employee")
    weekly_programs = relationship("WeeklyProgram", back_populates="employee")
    doctor_visits = relationship("DoctorVisit", back_populates="employee")
    pharmacy_visits = relationship("PharmacyVisit", back_populates="employee")

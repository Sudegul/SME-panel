from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("demo_employees.id"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)
    year = Column(Integer, nullable=False)  # Hangi yıl
    total_days = Column(Integer, nullable=False, default=0)  # Toplam hak
    used_days = Column(Integer, nullable=False, default=0)  # Kullanılan
    remaining_days = Column(Integer, nullable=False, default=0)  # Kalan (total - used)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Her çalışan için her izin türünde her yıl için tek bir kayıt olmalı
    __table_args__ = (
        UniqueConstraint('employee_id', 'leave_type_id', 'year', name='_employee_leavetype_year_uc'),
    )

    # Relationships
    employee = relationship("Employee", backref="leave_balances")
    leave_type = relationship("LeaveType", back_populates="leave_balances")

from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)
    year = Column(Integer, nullable=True)  # Eski sistem için (migration sonrası silinecek)
    service_year = Column(Integer, nullable=True)  # Çalışanın kaçıncı yılı (1, 2, 3...)
    carried_over_days = Column(Integer, nullable=False, default=0)  # Geçen yıldan taşınan
    current_year_entitlement = Column(Integer, nullable=False, default=0)  # Bu yıl hak edilen
    total_days = Column(Integer, nullable=False, default=0)  # Toplam hak (carried_over + current_year)
    used_days = Column(Integer, nullable=False, default=0)  # Kullanılan
    remaining_days = Column(Integer, nullable=False, default=0)  # Kalan (total - used)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Her çalışan için her izin türünde her service_year için tek bir kayıt olmalı
    __table_args__ = (
        UniqueConstraint('employee_id', 'leave_type_id', 'service_year', name='_employee_leavetype_serviceyear_uc'),
    )

    # Relationships
    employee = relationship("Employee", backref="leave_balances")
    leave_type = relationship("LeaveType", back_populates="leave_balances")

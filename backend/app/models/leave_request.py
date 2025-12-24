from sqlalchemy import Column, Integer, String, ForeignKey, Date, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class LeaveRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("demo_employees.id"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)

    # Tarihler
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    return_to_work_date = Column(Date, nullable=False)  # İşe dönüş tarihi
    total_days = Column(Integer, nullable=False)  # Kaç gün izin

    # Durum
    status = Column(Enum(LeaveRequestStatus), default=LeaveRequestStatus.PENDING, nullable=False)

    # Mesajlar
    message = Column(Text, nullable=True)  # Çalışanın mesajı
    rejection_reason = Column(Text, nullable=True)  # Red nedeni (manager tarafından)

    # Onay bilgileri
    approved_by = Column(Integer, ForeignKey("demo_employees.id"), nullable=True)  # Kim onayladı
    approved_at = Column(DateTime, nullable=True)  # Ne zaman onaylandı

    # Tarihler
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", foreign_keys=[employee_id], backref="leave_requests")
    leave_type = relationship("LeaveType", back_populates="leave_requests")
    approver = relationship("Employee", foreign_keys=[approved_by])

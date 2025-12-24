from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class GenderRestriction(str, enum.Enum):
    NONE = "NONE"
    MALE_ONLY = "MALE_ONLY"
    FEMALE_ONLY = "FEMALE_ONLY"


class LeaveType(Base):
    __tablename__ = "leave_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    max_days = Column(Integer, nullable=False)  # Maksimum gün hakkı
    is_paid = Column(Boolean, default=True)  # Ücretli mi?
    is_active = Column(Boolean, default=True)  # Kullanıma açık mı?
    gender_restriction = Column(Enum(GenderRestriction), default=GenderRestriction.NONE)  # Cinsiyet kısıtı
    description = Column(String, nullable=True)  # Açıklama (opsiyonel)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    leave_requests = relationship("LeaveRequest", back_populates="leave_type")
    leave_balances = relationship("LeaveBalance", back_populates="leave_type")

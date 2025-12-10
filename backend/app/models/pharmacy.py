
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Pharmacy(Base):
    __tablename__ = "demo_pharmacies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    city = Column(String, nullable=True)  # Şehir (küçük harf)
    district = Column(String, nullable=True)  # Semt/İlçe (küçük harf)
    street = Column(String, nullable=True)  # Sokak (küçük harf, "sk." yasak)
    employee_id = Column(Integer, ForeignKey("demo_employees.id"), nullable=True, index=True)  # İlk ekleyen satıcı
    is_approved = Column(Boolean, default=False, nullable=False)  # Manager/Admin onayı
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sales = relationship("Sale", back_populates="pharmacy")
    employee = relationship("Employee", foreign_keys=[employee_id])
    visits = relationship("PharmacyVisit", back_populates="pharmacy")

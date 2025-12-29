from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Text, Boolean, Time
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class PharmacyVisit(Base):
    """Günlük eczane ziyaretleri - Her gün hangi eczaneler ziyaret edildi"""
    __tablename__ = "pharmacy_visits"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    pharmacy_id = Column(Integer, ForeignKey("pharmacies.id"), nullable=False, index=True)  # Foreign Key
    visit_date = Column(Date, nullable=False, index=True)  # Hangi gün

    # Eczane bilgileri (ziyaret sırasında snapshot olarak kaydedilir)
    pharmacy_name = Column(String, nullable=False)
    pharmacy_address = Column(String, nullable=True)  # Eczane adresi

    # Ziyaret detayları
    start_time = Column(Time, nullable=True)  # Ziyaret başlangıç saati
    end_time = Column(Time, nullable=True)  # Ziyaret bitiş saati
    product_count = Column(Integer, default=0, nullable=False)  # Satılan ürün sayısı
    mf_count = Column(Integer, default=0, nullable=False)  # Verilen MF sayısı
    notes = Column(Text, nullable=True)  # Notlar
    is_approved = Column(Boolean, default=False, nullable=False)  # Manager/Admin onayı

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="pharmacy_visits")
    pharmacy = relationship("Pharmacy")

    def __repr__(self):
        return f"<PharmacyVisit {self.pharmacy_name} - {self.visit_date}>"

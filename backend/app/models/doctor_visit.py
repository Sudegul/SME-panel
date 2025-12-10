from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Text, Boolean, Time
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class DoctorVisit(Base):
    """Günlük hekim ziyaretleri - Her gün kaç hekim ziyaret edildi"""
    __tablename__ = "demo_doctor_visits"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("demo_employees.id"), nullable=False, index=True)
    visit_date = Column(Date, nullable=False, index=True)  # Hangi gün

    # Hekim bilgileri
    doctor_name = Column(String, nullable=False)  # Doktor adı
    hospital_name = Column(String, nullable=False)  # Hastane adı
    specialty = Column(String, nullable=True)  # Branş
    notes = Column(Text, nullable=True)  # Notlar

    # Ziyaret detayları
    start_time = Column(Time, nullable=True)  # Ziyaret başlangıç saati
    end_time = Column(Time, nullable=True)  # Ziyaret bitiş saati
    is_approved = Column(Boolean, default=False, nullable=False)  # Manager/Admin onayı

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="doctor_visits")

    def __repr__(self):
        return f"<DoctorVisit {self.doctor_name} - {self.visit_date}>"

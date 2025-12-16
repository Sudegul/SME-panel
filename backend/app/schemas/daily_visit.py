from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date, time


# Doctor Visit Schemas
class DoctorVisitBase(BaseModel):
    """Hekim ziyareti base"""
    doctor_name: str
    hospital_name: str
    specialty: Optional[str] = None
    supported_product: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    notes: Optional[str] = None


class DoctorVisitCreate(DoctorVisitBase):
    """Hekim ziyareti oluşturma"""
    visit_date: date


class DoctorVisitResponse(DoctorVisitBase):
    """Hekim ziyareti response"""
    id: int
    employee_id: int
    visit_date: date
    is_approved: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


# Pharmacy Visit Schemas
class PharmacyVisitBase(BaseModel):
    """Eczane ziyareti base"""
    pharmacy_id: int  # Foreign Key - seçilen/oluşturulan eczane
    pharmacy_name: str  # Backward compatibility
    pharmacy_address: Optional[str] = None  # Eczane adresi
    start_time: Optional[time] = None  # Ziyaret başlangıç saati
    end_time: Optional[time] = None  # Ziyaret bitiş saati
    product_count: int = 0  # Satılan ürün sayısı
    mf_count: int = 0  # Verilen MF sayısı
    notes: Optional[str] = None


class PharmacyVisitCreate(PharmacyVisitBase):
    """Eczane ziyareti oluşturma"""
    visit_date: date


class PharmacyVisitResponse(PharmacyVisitBase):
    """Eczane ziyareti response"""
    id: int
    employee_id: int
    visit_date: date
    is_approved: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


# Daily Report Summary
class DailyReportSummary(BaseModel):
    """Günlük rapor özeti"""
    visit_date: date
    employee_id: int
    employee_name: str
    total_doctor_visits: int
    total_pharmacy_visits: int
    doctor_visits: list[DoctorVisitResponse]
    pharmacy_visits: list[PharmacyVisitResponse]
    color_code: str  # "green" (20+), "orange" (15-19), "yellow" (<15)

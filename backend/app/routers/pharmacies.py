from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import date, datetime, timedelta
from pydantic import BaseModel, validator

from ..database import get_db
from ..models import Pharmacy, PharmacyVisit, Sale, Employee
from ..models.employee import EmployeeRole
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/pharmacies", tags=["Pharmacies"])


# Schemas
class PharmacyCreate(BaseModel):
    name: str
    city: Optional[str] = None
    district: Optional[str] = None
    street: Optional[str] = None

    @validator('city', 'district', 'street')
    def standardize_address(cls, v):
        if not v:
            return v
        # Küçük harfe çevir
        v = v.lower().strip()
        # Kısaltmaları kontrol et ve uyar
        forbidden = ['mah.', 'sk.', 'cad.', 'bulv.', 'sokak', 'mahalle', 'cadde', 'bulvar']
        for word in forbidden:
            if word in v:
                raise ValueError(f"Lütfen '{word}' gibi kısaltmalar kullanmayın. Sadece semt ve sokak adını yazın.")
        return v


@router.get("/")
async def get_pharmacies(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Tüm eczaneleri listele - Employee bilgisi ve toplam ürün/MF sayıları ile
    """
    # Pharmacies ile employee bilgisini join et
    pharmacies = db.query(Pharmacy).options(joinedload(Pharmacy.employee)).order_by(Pharmacy.created_at.desc()).all()

    # Her eczane için toplam ürün ve MF sayılarını hesapla
    result = []
    for pharmacy in pharmacies:
        # PharmacyVisit'lerden toplam product ve mf sayılarını al (Foreign Key kullanarak)
        visit_stats = db.query(
            func.sum(PharmacyVisit.product_count).label('total_products'),
            func.sum(PharmacyVisit.mf_count).label('total_mf')
        ).filter(
            PharmacyVisit.pharmacy_id == pharmacy.id  # Foreign Key ile güvenli eşleşme
        ).first()

        # Bu eczaneye ziyaret yapan satıcıları bul (benzersiz)
        visiting_employees = db.query(Employee.full_name).join(
            PharmacyVisit, PharmacyVisit.employee_id == Employee.id
        ).filter(
            PharmacyVisit.pharmacy_id == pharmacy.id
        ).distinct().all()

        visiting_employee_names = [emp.full_name for emp in visiting_employees] if visiting_employees else []

        # Adres bilgisini oluştur
        address_parts = []
        if pharmacy.district:
            address_parts.append(pharmacy.district)
        if pharmacy.street:
            address_parts.append(pharmacy.street)
        if pharmacy.city:
            address_parts.append(pharmacy.city)
        address_display = " / ".join(address_parts) if address_parts else ""

        result.append({
            "id": pharmacy.id,
            "name": pharmacy.name,
            "city": pharmacy.city,
            "district": pharmacy.district,
            "street": pharmacy.street,
            "address_display": address_display,
            "employee_id": pharmacy.employee_id,
            "employee_name": pharmacy.employee.full_name if pharmacy.employee else None,
            "visiting_employees": visiting_employee_names,  # Ziyaret yapan satıcılar
            "is_approved": pharmacy.is_approved,
            "total_products": int(visit_stats.total_products) if visit_stats.total_products else 0,
            "total_mf": int(visit_stats.total_mf) if visit_stats.total_mf else 0,
            "created_at": pharmacy.created_at.isoformat() if pharmacy.created_at else None
        })

    return result


@router.get("/search")
async def search_pharmacies(
    name: str,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    İsme göre eczane ara - Partial ve case-insensitive arama
    """
    # İsme göre ara (partial match, case-insensitive)
    search_term = f"%{name.lower().strip()}%"
    pharmacies = db.query(Pharmacy).filter(
        func.lower(Pharmacy.name).like(search_term)
    ).all()

    result = []
    for pharmacy in pharmacies:
        # Adres bilgisini oluştur
        address_parts = []
        if pharmacy.district:
            address_parts.append(pharmacy.district)
        if pharmacy.street:
            address_parts.append(pharmacy.street)
        if pharmacy.city:
            address_parts.append(pharmacy.city)

        address = " / ".join(address_parts) if address_parts else "Adres bilgisi yok"

        result.append({
            "id": pharmacy.id,
            "name": pharmacy.name,
            "city": pharmacy.city,
            "district": pharmacy.district,
            "street": pharmacy.street,
            "address_display": address,
            "employee_name": pharmacy.employee.full_name if pharmacy.employee else None,
            "is_approved": pharmacy.is_approved
        })

    return result


@router.post("/create")
async def create_pharmacy(
    pharmacy_data: PharmacyCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Yeni eczane oluştur - Adres standardizasyonu ile
    """
    # Yeni eczane oluştur
    new_pharmacy = Pharmacy(
        name=pharmacy_data.name.strip(),
        city=pharmacy_data.city,
        district=pharmacy_data.district,
        street=pharmacy_data.street,
        employee_id=current_user.id,  # İlk ekleyen satıcı
        is_approved=False  # Manager onayı bekliyor
    )

    db.add(new_pharmacy)
    db.commit()
    db.refresh(new_pharmacy)

    return {
        "id": new_pharmacy.id,
        "name": new_pharmacy.name,
        "city": new_pharmacy.city,
        "district": new_pharmacy.district,
        "street": new_pharmacy.street,
        "message": "Eczane başarıyla oluşturuldu. Manager onayı bekleniyor."
    }


@router.put("/{pharmacy_id}")
async def update_pharmacy(
    pharmacy_id: int,
    pharmacy_data: PharmacyCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Eczane bilgilerini güncelle - Herkes adres güncelleyebilir
    """
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Eczane bulunamadı")

    # Adres bilgilerini güncelle
    pharmacy.name = pharmacy_data.name.strip()
    pharmacy.city = pharmacy_data.city
    pharmacy.district = pharmacy_data.district
    pharmacy.street = pharmacy_data.street

    db.commit()
    db.refresh(pharmacy)

    return {
        "id": pharmacy.id,
        "name": pharmacy.name,
        "city": pharmacy.city,
        "district": pharmacy.district,
        "street": pharmacy.street,
        "message": "Eczane bilgileri başarıyla güncellendi."
    }


@router.post("/{pharmacy_id}/toggle-approval")
async def toggle_pharmacy_approval(
    pharmacy_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Eczane onayını toggle et (Manager/Admin only)
    """
    # Yetki kontrolü
    if current_user.role not in [EmployeeRole.MANAGER, EmployeeRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")

    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Eczane bulunamadı")

    # Toggle approval
    pharmacy.is_approved = not pharmacy.is_approved
    db.commit()
    db.refresh(pharmacy)

    return {
        "id": pharmacy.id,
        "name": pharmacy.name,
        "is_approved": pharmacy.is_approved
    }


@router.get("/stats")
async def get_pharmacy_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    employee_id: Optional[int] = None,
    period: Optional[str] = None,  # 'day', 'week', 'month', 'year'
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Eczane istatistikleri
    - Toplam eczane sayısı
    - Toplam ürün satışı (satış tablosundan)
    - Toplam MF (medikal firma) ziyareti sayısı (pharmacy_visits)
    """

    # Period'a göre tarih aralığı belirle
    if period:
        end_date = datetime.now().date()
        if period == 'day':
            start_date = end_date
        elif period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        elif period == 'year':
            start_date = end_date - timedelta(days=365)

    # Yetki kontrolü - EMPLOYEE kendi verilerini görür
    target_employee_id = None
    if current_user.role == "EMPLOYEE":
        target_employee_id = current_user.id
    elif employee_id:
        target_employee_id = employee_id

    # Toplam eczane sayısı
    total_pharmacies = db.query(func.count(Pharmacy.id)).scalar()

    # Pharmacy visits query (MF ziyaretleri)
    visit_query = db.query(func.count(PharmacyVisit.id))
    if target_employee_id:
        visit_query = visit_query.filter(PharmacyVisit.employee_id == target_employee_id)
    if start_date:
        visit_query = visit_query.filter(PharmacyVisit.visit_date >= start_date)
    if end_date:
        visit_query = visit_query.filter(PharmacyVisit.visit_date <= end_date)

    total_visits = visit_query.scalar() or 0

    # Sales query (ürün satışları)
    sales_query = db.query(func.sum(Sale.quantity))
    if target_employee_id:
        sales_query = sales_query.filter(Sale.employee_id == target_employee_id)
    if start_date:
        sales_query = sales_query.filter(Sale.sale_date >= start_date)
    if end_date:
        sales_query = sales_query.filter(Sale.sale_date <= end_date)

    total_products = sales_query.scalar() or 0

    return {
        "total_pharmacies": total_pharmacies,
        "total_products_sold": int(total_products),
        "total_mf_visits": total_visits,
        "period": {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None
        }
    }

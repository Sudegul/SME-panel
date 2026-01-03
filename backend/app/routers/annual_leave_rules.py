from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.annual_leave_rule import AnnualLeaveRule
from ..models.employee import Employee, EmployeeRole
from ..schemas.annual_leave_rule import (
    AnnualLeaveRuleResponse,
    AnnualLeaveRulesBulkUpdate
)
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/annual-leave-rules", tags=["Annual Leave Rules"])


@router.get("/", response_model=List[AnnualLeaveRuleResponse])
def get_annual_leave_rules(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Yıllık izin kurallarını listele
    Herkes görebilir
    """
    rules = db.query(AnnualLeaveRule).order_by(AnnualLeaveRule.year_of_service).all()
    return rules


@router.put("/", response_model=List[AnnualLeaveRuleResponse])
def update_annual_leave_rules(
    data: AnnualLeaveRulesBulkUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Yıllık izin kurallarını toplu güncelle
    Sadece MANAGER yapabilir
    """
    # Yetki kontrolü
    if current_user.role != EmployeeRole.MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için MANAGER yetkisi gereklidir"
        )

    # Tüm mevcut kuralları sil
    db.query(AnnualLeaveRule).delete()

    # Yeni kuralları ekle
    new_rules = []
    for rule_data in data.rules:
        rule = AnnualLeaveRule(
            year_of_service=rule_data.year_of_service,
            days_entitled=rule_data.days_entitled
        )
        db.add(rule)
        new_rules.append(rule)

    db.commit()

    # Refresh all
    for rule in new_rules:
        db.refresh(rule)

    return new_rules


def calculate_annual_leave_days(hire_date, current_year: int, db: Session) -> int:
    """
    [ESKİ SİSTEM - DEPRECATED]
    İşe giriş tarihine göre yıllık izin hakkını hesapla

    Args:
        hire_date: İşe giriş tarihi
        current_year: Hesaplama yapılacak yıl
        db: Database session

    Returns:
        Hak edilen yıllık izin günü
    """
    from datetime import date

    if not hire_date:
        return 14  # Varsayılan 14 gün

    # Kaç yıldır çalışıyor hesapla
    years_of_service = current_year - hire_date.year

    if years_of_service < 0:
        years_of_service = 0

    # Yıllık izin yılını 1'den başlat (1. yıl, 2. yıl vs.)
    year_index = years_of_service + 1

    # Kurallara göre hak edilen günü bul
    rule = db.query(AnnualLeaveRule).filter(
        AnnualLeaveRule.year_of_service == year_index
    ).first()

    if rule:
        return rule.days_entitled

    # Kural yoksa en yüksek yıla ait kuralı kullan
    max_rule = db.query(AnnualLeaveRule).order_by(
        AnnualLeaveRule.year_of_service.desc()
    ).first()

    if max_rule:
        return max_rule.days_entitled

    # Hiç kural yoksa varsayılan
    return 14


def calculate_annual_leave_days_by_service_year(service_year: int, db: Session) -> int:
    """
    [YENİ SİSTEM]
    Service year'a göre yıllık izin hakkını hesapla

    service_year = Kaç yıldönümü GEÇTİ (0'dan başlar)
    - service_year = 0: Henüz yıldönümü gelmedi → 0 gün
    - service_year = 1: 1. yıldönümü geçti → year_of_service=1 kuralı
    - service_year = 2: 2. yıldönümü geçti → year_of_service=2 kuralı
    - service_year = 5: 5. yıldönümü geçti → year_of_service=5 kuralı

    Args:
        service_year: Kaç yıldönümü geçti (0, 1, 2, 3...)
        db: Database session

    Returns:
        Hak edilen yıllık izin günü

    Örnek:
        service_year = 0 -> 0 gün (henüz yıldönümü gelmedi)
        service_year = 1 -> 14 gün (1. yıldönümü geçti, year_of_service=1 kuralı)
        service_year = 5 -> 20 gün (5. yıldönümü geçti, year_of_service=5 kuralı)
        service_year = 15 -> 26 gün (15. yıldönümü geçti, year_of_service=15 kuralı)
    """
    if service_year < 0:
        service_year = 0

    # Henüz yıldönümü gelmediyse hak yok
    if service_year == 0:
        return 0

    # service_year = year_of_service (bire bir eşleşiyor)
    # service_year = 1 → year_of_service = 1 (1. yıldönümü)
    # service_year = 2 → year_of_service = 2 (2. yıldönümü)
    year_of_service = service_year

    # Kurallara göre hak edilen günü bul
    rule = db.query(AnnualLeaveRule).filter(
        AnnualLeaveRule.year_of_service == year_of_service
    ).first()

    if rule:
        return rule.days_entitled

    # Kural yoksa en yüksek yıla ait kuralı kullan
    max_rule = db.query(AnnualLeaveRule).order_by(
        AnnualLeaveRule.year_of_service.desc()
    ).first()

    if max_rule:
        return max_rule.days_entitled

    # Hiç kural yoksa varsayılan
    return 14

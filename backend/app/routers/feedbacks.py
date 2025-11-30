from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..models import Feedback, FeedbackTargetType, Employee, EmployeeRole, Doctor, Pharmacy
from ..utils.dependencies import get_current_user
from pydantic import BaseModel


router = APIRouter(prefix="/feedbacks", tags=["feedbacks"])


# Pydantic Schemas
class FeedbackCreate(BaseModel):
    employee_id: int
    visit_type: FeedbackTargetType
    target_id: int
    target_name: str
    feedback_text: str
    visit_id: Optional[int] = None


class FeedbackResponse(BaseModel):
    id: int
    manager_id: int
    manager_name: str
    employee_id: int
    employee_name: str
    visit_type: str
    target_id: int
    target_name: str
    feedback_text: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# 1. Manager: Geri dönüş oluştur
@router.post("/", response_model=FeedbackResponse)
def create_feedback(
    feedback: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Manager'lar çalışanlara doktor/eczane ziyaretleri hakkında geri dönüş yapar.

    Sadece MANAGER rolü kullanabilir.
    """
    # Sadece manager'lar geri dönüş yapabilir
    if current_user.role != EmployeeRole.MANAGER:
        raise HTTPException(status_code=403, detail="Sadece yöneticiler geri dönüş yapabilir")

    # Çalışanın var olduğunu kontrol et
    employee = db.query(Employee).filter(Employee.id == feedback.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Çalışan bulunamadı")

    # Yeni feedback oluştur
    new_feedback = Feedback(
        manager_id=current_user.id,
        employee_id=feedback.employee_id,
        visit_id=feedback.visit_id,
        visit_type=feedback.visit_type,
        target_id=feedback.target_id,
        target_name=feedback.target_name,
        feedback_text=feedback.feedback_text,
        is_read=False
    )

    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)

    # Response oluştur
    return FeedbackResponse(
        id=new_feedback.id,
        manager_id=new_feedback.manager_id,
        manager_name=current_user.full_name,
        employee_id=new_feedback.employee_id,
        employee_name=employee.full_name,
        visit_type=new_feedback.visit_type.value,
        target_id=new_feedback.target_id,
        target_name=new_feedback.target_name,
        feedback_text=new_feedback.feedback_text,
        is_read=new_feedback.is_read,
        created_at=new_feedback.created_at
    )


# 2. Çalışan: Kendi geri dönüşlerini listele (Filtreleme ile)
@router.get("/my-feedbacks", response_model=List[FeedbackResponse])
def get_my_feedbacks(
    filter: Optional[str] = Query(None, description="Filter: 'week', 'month', 'all'"),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Çalışan kendi geri dönüşlerini görür.

    Filter parametresi:
    - 'week': Son 1 hafta
    - 'month': Son 1 ay
    - 'all' veya None: Tümü
    """
    query = db.query(Feedback).filter(Feedback.employee_id == current_user.id)

    # Tarih filtresi uygula
    if filter == "week":
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        query = query.filter(Feedback.created_at >= one_week_ago)
    elif filter == "month":
        one_month_ago = datetime.utcnow() - timedelta(days=30)
        query = query.filter(Feedback.created_at >= one_month_ago)
    # 'all' veya None ise tüm geri dönüşleri getir

    feedbacks = query.order_by(Feedback.created_at.desc()).all()

    # Response oluştur
    result = []
    for fb in feedbacks:
        manager = db.query(Employee).filter(Employee.id == fb.manager_id).first()
        result.append(FeedbackResponse(
            id=fb.id,
            manager_id=fb.manager_id,
            manager_name=manager.full_name if manager else "Bilinmeyen",
            employee_id=fb.employee_id,
            employee_name=current_user.full_name,
            visit_type=fb.visit_type.value,
            target_id=fb.target_id,
            target_name=fb.target_name,
            feedback_text=fb.feedback_text,
            is_read=fb.is_read,
            created_at=fb.created_at
        ))

    return result


# 3. Geri dönüşü okundu olarak işaretle
@router.patch("/{feedback_id}/mark-read")
def mark_feedback_as_read(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Çalışan geri dönüşü okuduğunda is_read=True yapar.
    """
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()

    if not feedback:
        raise HTTPException(status_code=404, detail="Geri dönüş bulunamadı")

    # Sadece geri dönüşün sahibi okuyabilir
    if feedback.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu geri dönüşü görme yetkiniz yok")

    feedback.is_read = True
    db.commit()

    return {"message": "Geri dönüş okundu olarak işaretlendi"}


# 4. Manager: Tüm geri dönüşleri görüntüle (opsiyonel - istatistikler için)
@router.get("/all", response_model=List[FeedbackResponse])
def get_all_feedbacks(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Manager tüm geri dönüşleri görür.
    """
    if current_user.role != EmployeeRole.MANAGER:
        raise HTTPException(status_code=403, detail="Sadece yöneticiler tüm geri dönüşleri görebilir")

    feedbacks = db.query(Feedback).order_by(Feedback.created_at.desc()).all()

    result = []
    for fb in feedbacks:
        manager = db.query(Employee).filter(Employee.id == fb.manager_id).first()
        employee = db.query(Employee).filter(Employee.id == fb.employee_id).first()
        result.append(FeedbackResponse(
            id=fb.id,
            manager_id=fb.manager_id,
            manager_name=manager.full_name if manager else "Bilinmeyen",
            employee_id=fb.employee_id,
            employee_name=employee.full_name if employee else "Bilinmeyen",
            visit_type=fb.visit_type.value,
            target_id=fb.target_id,
            target_name=fb.target_name,
            feedback_text=fb.feedback_text,
            is_read=fb.is_read,
            created_at=fb.created_at
        ))

    return result

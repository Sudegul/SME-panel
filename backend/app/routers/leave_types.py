from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.employee import Employee, EmployeeRole
from ..models.leave_type import LeaveType
from ..models.leave_request import LeaveRequest
from ..schemas.leave_type import LeaveTypeCreate, LeaveTypeUpdate, LeaveTypeResponse
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/leave-types", tags=["Leave Types"])


@router.get("/", response_model=List[LeaveTypeResponse])
def get_all_leave_types(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Tüm izin türlerini listele
    - include_inactive=True: pasif olanları da göster (sadece manager)
    - include_inactive=False: sadece aktif olanları göster (herkes)
    """
    query = db.query(LeaveType)

    # Manager değilse sadece aktif olanları göster
    if current_user.role not in [EmployeeRole.ADMIN, EmployeeRole.MANAGER]:
        query = query.filter(LeaveType.is_active == True)
    elif not include_inactive:
        query = query.filter(LeaveType.is_active == True)

    leave_types = query.order_by(LeaveType.name).all()
    return leave_types


@router.get("/{leave_type_id}", response_model=LeaveTypeResponse)
def get_leave_type(
    leave_type_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """Belirli bir izin türünü getir"""
    leave_type = db.query(LeaveType).filter(LeaveType.id == leave_type_id).first()

    if not leave_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="İzin türü bulunamadı"
        )

    # Manager değilse sadece aktif olanları görebilir
    if current_user.role not in [EmployeeRole.ADMIN, EmployeeRole.MANAGER]:
        if not leave_type.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bu izin türüne erişim yetkiniz yok"
            )

    return leave_type


@router.post("/", response_model=LeaveTypeResponse, status_code=status.HTTP_201_CREATED)
def create_leave_type(
    leave_type_data: LeaveTypeCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Yeni izin türü oluştur (sadece Manager)
    """
    # Yetki kontrolü
    if current_user.role not in [EmployeeRole.ADMIN, EmployeeRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için yetkiniz yok"
        )

    # İsim benzersizliği kontrolü
    existing = db.query(LeaveType).filter(LeaveType.name == leave_type_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{leave_type_data.name}' adında bir izin türü zaten mevcut"
        )

    # Yeni izin türü oluştur
    leave_type = LeaveType(**leave_type_data.model_dump())
    db.add(leave_type)
    db.commit()
    db.refresh(leave_type)

    return leave_type


@router.put("/{leave_type_id}", response_model=LeaveTypeResponse)
def update_leave_type(
    leave_type_id: int,
    leave_type_data: LeaveTypeUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    İzin türünü güncelle (sadece Manager)
    """
    # Yetki kontrolü
    if current_user.role not in [EmployeeRole.ADMIN, EmployeeRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için yetkiniz yok"
        )

    # İzin türünü bul
    leave_type = db.query(LeaveType).filter(LeaveType.id == leave_type_id).first()
    if not leave_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="İzin türü bulunamadı"
        )

    # Yıllık İzin türü için özel kontroller
    if leave_type.name == "Yıllık İzin":
        # İsim değiştirilemez
        if leave_type_data.name and leave_type_data.name != "Yıllık İzin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Yıllık İzin türünün adı değiştirilemez."
            )
        # Max_days değiştirilemez (Yıllık İzin Hakları'ndan yönetilir)
        if leave_type_data.max_days is not None and leave_type_data.max_days != leave_type.max_days:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Yıllık İzin gün sayısı buradan değiştirilemez. Lütfen 'Yıllık İzin Hakları' ayarlarını kullanın."
            )

    # İsim değişiyorsa benzersizlik kontrolü
    if leave_type_data.name and leave_type_data.name != leave_type.name:
        existing = db.query(LeaveType).filter(LeaveType.name == leave_type_data.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{leave_type_data.name}' adında bir izin türü zaten mevcut"
            )

    # Güncelle
    update_data = leave_type_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(leave_type, field, value)

    db.commit()
    db.refresh(leave_type)

    return leave_type


@router.delete("/{leave_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_leave_type(
    leave_type_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    İzin türünü sil (sadece Manager)
    Eğer bu izin türüyle daha önce talep oluşturulmuşsa silinemez
    """
    # Yetki kontrolü
    if current_user.role not in [EmployeeRole.ADMIN, EmployeeRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için yetkiniz yok"
        )

    # İzin türünü bul
    leave_type = db.query(LeaveType).filter(LeaveType.id == leave_type_id).first()
    if not leave_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="İzin türü bulunamadı"
        )

    # Yıllık İzin türü silinemez (sistem tarafından özel kullanılıyor)
    if leave_type.name == "Yıllık İzin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yıllık İzin türü silinemez. Bu tür sistem tarafından özel olarak kullanılmaktadır."
        )

    # Bu izin türüyle talep var mı kontrol et
    existing_requests = db.query(LeaveRequest).filter(
        LeaveRequest.leave_type_id == leave_type_id
    ).first()

    if existing_requests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu izin türüyle oluşturulmuş talepler mevcut. Silme yerine pasif yapabilirsiniz."
        )

    # Sil
    db.delete(leave_type)
    db.commit()

    return None


@router.patch("/{leave_type_id}/toggle-active", response_model=LeaveTypeResponse)
def toggle_leave_type_active(
    leave_type_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    İzin türünü aktif/pasif yap (sadece Manager)
    """
    # Yetki kontrolü
    if current_user.role not in [EmployeeRole.ADMIN, EmployeeRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için yetkiniz yok"
        )

    # İzin türünü bul
    leave_type = db.query(LeaveType).filter(LeaveType.id == leave_type_id).first()
    if not leave_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="İzin türü bulunamadı"
        )

    # Yıllık İzin türü pasif yapılamaz (sistem tarafından özel kullanılıyor)
    if leave_type.name == "Yıllık İzin" and leave_type.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yıllık İzin türü pasif yapılamaz. Bu tür sistem tarafından özel olarak kullanılmaktadır ve yıllık izin kuralları ile bağlantılıdır."
        )

    # Toggle
    leave_type.is_active = not leave_type.is_active
    db.commit()
    db.refresh(leave_type)

    return leave_type

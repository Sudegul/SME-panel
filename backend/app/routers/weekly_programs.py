from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from datetime import datetime, date, time

from ..database import get_db
from ..models import WeeklyProgram, Employee
from ..schemas.weekly_program import WeeklyProgramCreate, WeeklyProgramResponse, DayPlan
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/weekly-programs", tags=["Weekly Programs"])


def check_submission_deadline(week_start: date) -> bool:
    """
    Kontrol: Hafta başlamadan önce Pazar günü 23:59'a kadar girilebilir
    """
    now = datetime.now()
    today = now.date()

    # Hafta başlamışsa giriş yapılamaz
    if today >= week_start:
        return False

    # Hafta başlamamışsa giriş yapılabilir (son tarih: bir önceki Pazar 23:59)
    # Şu an Pazar günü mü ve 23:59'dan önce mi kontrol et
    # Veya hafta henüz başlamamış mı
    return True


@router.post("/", response_model=WeeklyProgramResponse, status_code=status.HTTP_201_CREATED)
async def create_weekly_program(
    program_data: WeeklyProgramCreate,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Haftalık program oluştur
    - Sadece hafta başlamadan önce oluşturulabilir
    - Son giriş: Önceki Pazar 23:59
    """
    # Zaman kısıtlaması kontrolü
    if not check_submission_deadline(program_data.week_start):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu haftanın programı için son giriş tarihi geçti. Program sadece hafta başlamadan önce oluşturulabilir."
        )

    # Bu hafta için zaten program var mı kontrol et
    existing = db.query(WeeklyProgram).filter(
        and_(
            WeeklyProgram.employee_id == current_user.id,
            WeeklyProgram.week_start == program_data.week_start
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu hafta için zaten bir program oluşturulmuş."
        )

    # Days'i JSON'a çevir
    days_json = [day.dict() for day in program_data.days]

    # Yeni program oluştur
    db_program = WeeklyProgram(
        employee_id=current_user.id,
        week_start=program_data.week_start,
        week_end=program_data.week_end,
        days_json=days_json,
        submitted=True,
        submitted_at=datetime.now()
    )

    db.add(db_program)
    db.commit()
    db.refresh(db_program)

    # Response oluştur
    days_list = [DayPlan(**day) for day in db_program.days_json]

    return WeeklyProgramResponse(
        id=db_program.id,
        employee_id=db_program.employee_id,
        employee_name=current_user.full_name,
        week_start=db_program.week_start,
        week_end=db_program.week_end,
        days=days_list,
        submitted=db_program.submitted,
        submitted_at=db_program.submitted_at,
        created_at=db_program.created_at
    )


@router.get("/", response_model=List[WeeklyProgramResponse])
async def get_weekly_programs(
    employee_id: int = None,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Haftalık programları listele
    - EMPLOYEE: Sadece kendi programlarını görebilir
    - MANAGER/ADMIN: Tüm programları veya employee_id'ye göre filtrelenmiş programları görebilir
    """
    query = db.query(WeeklyProgram)

    # Yetki kontrolü
    if current_user.role == "EMPLOYEE":
        query = query.filter(WeeklyProgram.employee_id == current_user.id)
    elif employee_id:
        query = query.filter(WeeklyProgram.employee_id == employee_id)

    programs = query.order_by(WeeklyProgram.week_start.desc()).all()

    # Response listesi oluştur
    result = []
    for program in programs:
        employee = db.query(Employee).filter(Employee.id == program.employee_id).first()
        days_list = [DayPlan(**day) for day in program.days_json]

        result.append(WeeklyProgramResponse(
            id=program.id,
            employee_id=program.employee_id,
            employee_name=employee.full_name if employee else "Unknown",
            week_start=program.week_start,
            week_end=program.week_end,
            days=days_list,
            submitted=program.submitted,
            submitted_at=program.submitted_at,
            created_at=program.created_at
        ))

    return result


@router.get("/{program_id}", response_model=WeeklyProgramResponse)
async def get_weekly_program(
    program_id: int,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Tek bir haftalık programı getir
    """
    program = db.query(WeeklyProgram).filter(WeeklyProgram.id == program_id).first()

    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program bulunamadı"
        )

    # Yetki kontrolü
    if current_user.role == "EMPLOYEE" and program.employee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu programı görüntüleme yetkiniz yok"
        )

    employee = db.query(Employee).filter(Employee.id == program.employee_id).first()
    days_list = [DayPlan(**day) for day in program.days_json]

    return WeeklyProgramResponse(
        id=program.id,
        employee_id=program.employee_id,
        employee_name=employee.full_name if employee else "Unknown",
        week_start=program.week_start,
        week_end=program.week_end,
        days=days_list,
        submitted=program.submitted,
        submitted_at=program.submitted_at,
        created_at=program.created_at
    )


@router.delete("/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_weekly_program(
    program_id: int,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Haftalık programı sil (sadece kendi programını silebilir)
    """
    program = db.query(WeeklyProgram).filter(WeeklyProgram.id == program_id).first()

    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program bulunamadı"
        )

    # Sadece kendi programını silebilir
    if program.employee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu programı silme yetkiniz yok"
        )

    # Hafta başlamışsa silemez
    if not check_submission_deadline(program.week_start):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hafta başladığı için program silinemez"
        )

    db.delete(program)
    db.commit()

    return None


@router.put("/{program_id}", response_model=WeeklyProgramResponse)
async def update_weekly_program(
    program_id: int,
    request: WeeklyProgramCreate,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Haftalık programı güncelle - Pazar 23:59'a kadar güncellenebilir
    """
    program = db.query(WeeklyProgram).filter(WeeklyProgram.id == program_id).first()

    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program bulunamadı"
        )

    # Sadece kendi programını güncelleyebilir
    if program.employee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu programı güncelleme yetkiniz yok"
        )

    # Pazar 23:59'a kadar güncellenebilir
    from datetime import datetime, time
    sunday_end = datetime.combine(program.week_end, time(23, 59, 59))
    now = datetime.now()

    if now > sunday_end:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Güncelleme süresi doldu (Pazar 23:59'a kadar güncelleme yapılabilir)"
        )

    # Programı güncelle
    program.week_start = request.week_start
    program.week_end = request.week_end
    program.days_json = [day.dict() for day in request.days]

    db.commit()
    db.refresh(program)

    employee = db.query(Employee).filter(Employee.id == program.employee_id).first()
    days_list = [DayPlan(**day) for day in program.days_json]

    return WeeklyProgramResponse(
        id=program.id,
        employee_id=program.employee_id,
        employee_name=employee.full_name if employee else "Unknown",
        week_start=program.week_start,
        week_end=program.week_end,
        days=days_list,
        submitted=program.submitted,
        submitted_at=program.submitted_at,
        created_at=program.created_at
    )

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from datetime import date, timedelta
from pydantic import BaseModel

from ..database import get_db
from ..models import WeeklyProgram, DoctorVisit, Employee
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/status-reports", tags=["Status Reports"])


class DoctorComparisonItem(BaseModel):
    """Planlanan ve gerçekleşen doktor karşılaştırması"""
    hospital_name: str
    doctor_name: str
    planned: bool  # Haftalık programda var mı?
    visited: bool  # Ziyaret edildi mi?
    status: str  # "completed", "missed", "extra"


class DayStatusReport(BaseModel):
    """Günlük durum raporu"""
    date: date
    day_name: str
    doctors: List[DoctorComparisonItem]


class WeeklyStatusReport(BaseModel):
    """Haftalık durum raporu"""
    employee_id: int
    employee_name: str
    week_start: date
    week_end: date
    total_planned: int
    total_visited: int
    total_missed: int
    completion_rate: float  # Yüzde
    days: List[DayStatusReport]


@router.get("/weekly", response_model=List[WeeklyStatusReport])
async def get_weekly_status_report(
    week_start: date = None,
    employee_id: int = None,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Haftalık durum raporu - Planlanan vs Gerçekleşen
    SADECE MANAGER/ADMIN görebilir
    """
    # Yetki kontrolü
    if current_user.role not in ["MANAGER", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu raporu görüntüleme yetkiniz yok. Sadece yöneticiler erişebilir."
        )

    # Query weekly programs
    program_query = db.query(WeeklyProgram)

    if week_start:
        program_query = program_query.filter(WeeklyProgram.week_start == week_start)

    if employee_id:
        program_query = program_query.filter(WeeklyProgram.employee_id == employee_id)

    programs = program_query.order_by(WeeklyProgram.week_start.desc()).all()

    reports = []

    for program in programs:
        employee = db.query(Employee).filter(Employee.id == program.employee_id).first()

        if not employee:
            continue

        # Her gün için karşılaştırma yap
        day_reports = []
        total_planned = 0
        total_visited = 0
        total_missed = 0

        for day in program.days_json:
            day_date = date.fromisoformat(day["date"])

            # Planlanan doktorlar
            planned_doctors = []
            for visit in day.get("visits", []):
                hospital = visit["hospital_name"]
                for doctor in visit["doctors"]:
                    planned_doctors.append({
                        "hospital": hospital,
                        "doctor": doctor
                    })
                    total_planned += 1

            # Gerçekleşen ziyaretler
            actual_visits = db.query(DoctorVisit).filter(
                and_(
                    DoctorVisit.employee_id == program.employee_id,
                    DoctorVisit.visit_date == day_date
                )
            ).all()

            # Karşılaştırma
            comparisons = []
            visited_doctors = []

            # Planlanan doktorları kontrol et
            for planned in planned_doctors:
                found = False
                for actual in actual_visits:
                    if (actual.hospital_name.lower() == planned["hospital"].lower() and
                        actual.doctor_name.lower() == planned["doctor"].lower()):
                        found = True
                        visited_doctors.append(actual.id)
                        break

                if found:
                    comparisons.append(DoctorComparisonItem(
                        hospital_name=planned["hospital"],
                        doctor_name=planned["doctor"],
                        planned=True,
                        visited=True,
                        status="completed"
                    ))
                    total_visited += 1
                else:
                    comparisons.append(DoctorComparisonItem(
                        hospital_name=planned["hospital"],
                        doctor_name=planned["doctor"],
                        planned=True,
                        visited=False,
                        status="missed"
                    ))
                    total_missed += 1

            # Ekstra ziyaretler (planlanmamış)
            for actual in actual_visits:
                if actual.id not in visited_doctors:
                    comparisons.append(DoctorComparisonItem(
                        hospital_name=actual.hospital_name,
                        doctor_name=actual.doctor_name,
                        planned=False,
                        visited=True,
                        status="extra"
                    ))

            day_reports.append(DayStatusReport(
                date=day_date,
                day_name=day["day_name"],
                doctors=comparisons
            ))

        # Tamamlanma oranı
        completion_rate = (total_visited / total_planned * 100) if total_planned > 0 else 0

        reports.append(WeeklyStatusReport(
            employee_id=program.employee_id,
            employee_name=employee.full_name,
            week_start=program.week_start,
            week_end=program.week_end,
            total_planned=total_planned,
            total_visited=total_visited,
            total_missed=total_missed,
            completion_rate=round(completion_rate, 2),
            days=day_reports
        ))

    return reports

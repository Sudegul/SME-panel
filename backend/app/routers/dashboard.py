from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from typing import Optional
from datetime import date, datetime, timedelta

from ..database import get_db
from ..models.employee import Employee, EmployeeRole
from ..models.visit import Visit
from ..models.sale import Sale
from ..models.case import Case, CaseStatus
from ..models.goal import Goal
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    employee_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    period: Optional[str] = Query(None, regex="^(day|week|month|year)$"),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Dashboard istatistikleri
    - Admin/Manager: Tüm çalışanları veya seçili çalışanı görebilir
    - Employee: Sadece kendisini görebilir
    """
    # Yetki kontrolü
    if current_user.role not in [EmployeeRole.ADMIN, EmployeeRole.MANAGER]:
        employee_id = current_user.id
    elif employee_id is None:
        # Admin tüm çalışanları görmek istiyorsa
        pass

    # Tarih aralığını belirle
    if not start_date or not end_date:
        if period == "day":
            start_date = date.today()
            end_date = date.today()
        elif period == "week":
            start_date = date.today() - timedelta(days=7)
            end_date = date.today()
        elif period == "month":
            start_date = date.today().replace(day=1)
            end_date = date.today()
        elif period == "year":
            start_date = date.today().replace(month=1, day=1)
            end_date = date.today()
        else:
            # Varsayılan: Son 30 gün
            start_date = date.today() - timedelta(days=30)
            end_date = date.today()

    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    # Ziyaret istatistikleri
    visit_query = db.query(Visit).filter(
        and_(
            Visit.visit_date >= start_datetime,
            Visit.visit_date <= end_datetime
        )
    )
    if employee_id:
        visit_query = visit_query.filter(Visit.employee_id == employee_id)

    total_visits = visit_query.count()
    doctor_visits = visit_query.filter(Visit.visit_type == "doctor").count()
    pharmacy_visits = visit_query.filter(Visit.visit_type == "pharmacy").count()

    # Satış istatistikleri
    sale_query = db.query(Sale).filter(
        and_(
            Sale.sale_date >= start_datetime,
            Sale.sale_date <= end_datetime
        )
    )
    if employee_id:
        sale_query = sale_query.filter(Sale.employee_id == employee_id)

    total_sales = sale_query.count()
    total_revenue = db.query(func.sum(Sale.total_amount)).filter(
        and_(
            Sale.sale_date >= start_datetime,
            Sale.sale_date <= end_datetime
        )
    )
    if employee_id:
        total_revenue = total_revenue.filter(Sale.employee_id == employee_id)
    total_revenue = total_revenue.scalar() or 0.0

    # Case istatistikleri
    case_query = db.query(Case)
    if employee_id:
        case_query = case_query.filter(Case.employee_id == employee_id)

    open_cases = case_query.filter(Case.status == CaseStatus.OPEN).count()
    in_progress_cases = case_query.filter(Case.status == CaseStatus.IN_PROGRESS).count()
    closed_cases = case_query.filter(Case.status == CaseStatus.CLOSED).count()

    # Hedef durumu
    goal_query = db.query(Goal).filter(
        and_(
            Goal.period_start <= end_date,
            Goal.period_end >= start_date
        )
    )
    if employee_id:
        goal_query = goal_query.filter(Goal.employee_id == employee_id)

    current_goal = goal_query.first()

    goal_status = None
    if current_goal:
        visit_progress = (total_visits / current_goal.target_visits * 100) if current_goal.target_visits > 0 else 0
        sales_progress = (total_revenue / current_goal.target_sales * 100) if current_goal.target_sales > 0 else 0

        goal_status = {
            "target_visits": current_goal.target_visits,
            "current_visits": total_visits,
            "visit_progress": round(visit_progress, 2),
            "target_sales": current_goal.target_sales,
            "current_sales": round(total_revenue, 2),
            "sales_progress": round(sales_progress, 2)
        }

    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "visits": {
            "total": total_visits,
            "doctor": doctor_visits,
            "pharmacy": pharmacy_visits
        },
        "sales": {
            "total_count": total_sales,
            "total_revenue": round(total_revenue, 2)
        },
        "cases": {
            "open": open_cases,
            "in_progress": in_progress_cases,
            "closed": closed_cases,
            "total": open_cases + in_progress_cases + closed_cases
        },
        "goal": goal_status
    }


@router.get("/visits-chart")
def get_visits_chart(
    employee_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    group_by: str = Query("day", regex="^(day|week|month|year)$"),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Ziyaret grafiği verisi (günlük/haftalık/aylık/yıllık)
    """
    # Yetki kontrolü
    if current_user.role not in [EmployeeRole.ADMIN, EmployeeRole.MANAGER]:
        employee_id = current_user.id

    # Varsayılan tarih aralığı
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()

    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    # Gruplama için SQL
    if group_by == "day":
        date_trunc = func.date_trunc('day', Visit.visit_date)
    elif group_by == "week":
        date_trunc = func.date_trunc('week', Visit.visit_date)
    elif group_by == "month":
        date_trunc = func.date_trunc('month', Visit.visit_date)
    else:  # year
        date_trunc = func.date_trunc('year', Visit.visit_date)

    query = db.query(
        date_trunc.label('period'),
        func.count(Visit.id).label('count')
    ).filter(
        and_(
            Visit.visit_date >= start_datetime,
            Visit.visit_date <= end_datetime
        )
    )

    if employee_id:
        query = query.filter(Visit.employee_id == employee_id)

    results = query.group_by('period').order_by('period').all()

    return {
        "group_by": group_by,
        "data": [
            {
                "period": r.period.isoformat() if r.period else None,
                "count": r.count
            }
            for r in results
        ]
    }


@router.get("/sales-chart")
def get_sales_chart(
    employee_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    group_by: str = Query("day", regex="^(day|week|month|year)$"),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Satış grafiği verisi (günlük/haftalık/aylık/yıllık)
    """
    # Yetki kontrolü
    if current_user.role not in [EmployeeRole.ADMIN, EmployeeRole.MANAGER]:
        employee_id = current_user.id

    # Varsayılan tarih aralığı
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()

    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    # Gruplama için SQL
    if group_by == "day":
        date_trunc = func.date_trunc('day', Sale.sale_date)
    elif group_by == "week":
        date_trunc = func.date_trunc('week', Sale.sale_date)
    elif group_by == "month":
        date_trunc = func.date_trunc('month', Sale.sale_date)
    else:  # year
        date_trunc = func.date_trunc('year', Sale.sale_date)

    query = db.query(
        date_trunc.label('period'),
        func.count(Sale.id).label('count'),
        func.sum(Sale.total_amount).label('revenue')
    ).filter(
        and_(
            Sale.sale_date >= start_datetime,
            Sale.sale_date <= end_datetime
        )
    )

    if employee_id:
        query = query.filter(Sale.employee_id == employee_id)

    results = query.group_by('period').order_by('period').all()

    return {
        "group_by": group_by,
        "data": [
            {
                "period": r.period.isoformat() if r.period else None,
                "count": r.count,
                "revenue": float(r.revenue) if r.revenue else 0.0
            }
            for r in results
        ]
    }


@router.get("/top-employees")
def get_top_employees(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    En başarılı çalışanlar (sadece Admin/Manager görebilir)
    """
    if current_user.role not in [EmployeeRole.ADMIN, EmployeeRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")

    # Varsayılan tarih aralığı
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()

    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    # En çok satış yapan çalışanlar
    results = db.query(
        Employee.id,
        Employee.full_name,
        func.count(Visit.id).label('visit_count'),
        func.count(Sale.id).label('sale_count'),
        func.coalesce(func.sum(Sale.total_amount), 0).label('total_revenue')
    ).outerjoin(
        Visit, and_(
            Visit.employee_id == Employee.id,
            Visit.visit_date >= start_datetime,
            Visit.visit_date <= end_datetime
        )
    ).outerjoin(
        Sale, and_(
            Sale.employee_id == Employee.id,
            Sale.sale_date >= start_datetime,
            Sale.sale_date <= end_datetime
        )
    ).filter(
        Employee.role == EmployeeRole.EMPLOYEE
    ).group_by(
        Employee.id, Employee.full_name
    ).order_by(
        func.sum(Sale.total_amount).desc()
    ).limit(limit).all()

    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "employees": [
            {
                "id": r.id,
                "name": r.full_name,
                "visit_count": r.visit_count or 0,
                "sale_count": r.sale_count or 0,
                "total_revenue": float(r.total_revenue) if r.total_revenue else 0.0
            }
            for r in results
        ]
    }


@router.get("/employee-ranking")
def get_employee_ranking(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Çalışan sıralaması - Kullanıcı kendi sırasını görebilir
    """
    # Varsayılan tarih aralığı
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()

    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    # Tüm çalışanların satış toplamları
    rankings = db.query(
        Employee.id,
        Employee.full_name,
        func.coalesce(func.sum(Sale.total_amount), 0).label('total_revenue')
    ).outerjoin(
        Sale, and_(
            Sale.employee_id == Employee.id,
            Sale.sale_date >= start_datetime,
            Sale.sale_date <= end_datetime
        )
    ).filter(
        Employee.role == EmployeeRole.EMPLOYEE
    ).group_by(
        Employee.id, Employee.full_name
    ).order_by(
        func.sum(Sale.total_amount).desc()
    ).all()

    # Kullanıcının sırasını bul
    user_rank = None
    for idx, r in enumerate(rankings, 1):
        if r.id == current_user.id:
            user_rank = {
                "rank": idx,
                "total_employees": len(rankings),
                "revenue": float(r.total_revenue) if r.total_revenue else 0.0
            }
            break

    # Admin/Manager ise tüm sıralamayı döndür
    if current_user.role in [EmployeeRole.ADMIN, EmployeeRole.MANAGER]:
        return {
            "my_ranking": user_rank,
            "all_rankings": [
                {
                    "rank": idx,
                    "id": r.id,
                    "name": r.full_name,
                    "revenue": float(r.total_revenue) if r.total_revenue else 0.0
                }
                for idx, r in enumerate(rankings, 1)
            ]
        }
    else:
        return {
            "my_ranking": user_rank
        }

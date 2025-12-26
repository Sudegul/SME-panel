from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from typing import Optional
from datetime import date, datetime, timedelta

from ..database import get_db
from ..models.employee import Employee, EmployeeRole
from ..models.doctor_visit import DoctorVisit
from ..models.pharmacy_visit import PharmacyVisit
from ..models.sale import Sale
from ..models.goal import Goal
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    employee_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    period: Optional[str] = Query(None, regex="^(day|week|last-week|month|year)$"),
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
        today = date.today()
        if period == "day":
            start_date = today
            end_date = today
        elif period == "week":
            # Bu hafta: Önceki pazar 00:00'dan bugüne kadar
            weekday = today.weekday()
            if weekday == 6:  # Bugün pazar
                days_since_sunday = 0
            else:
                days_since_sunday = weekday + 1

            last_sunday = today - timedelta(days=days_since_sunday)
            start_date = last_sunday
            end_date = today
        elif period == "last-week":
            # Geçen hafta: 2 pazar öncesi 00:00'dan geçen pazar 23:59'a kadar
            weekday = today.weekday()
            if weekday == 6:
                days_since_sunday = 0
            else:
                days_since_sunday = weekday + 1

            last_sunday = today - timedelta(days=days_since_sunday)
            prev_sunday = last_sunday - timedelta(days=7)
            start_date = prev_sunday
            end_date = last_sunday - timedelta(days=1)  # Geçen cumartesi 23:59
        elif period == "month":
            start_date = today.replace(day=1)
            end_date = today
        elif period == "year":
            start_date = today.replace(month=1, day=1)
            end_date = today
        else:
            # Varsayılan: Son 30 gün
            start_date = today - timedelta(days=30)
            end_date = today

    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    # Ziyaret istatistikleri
    doctor_visit_query = db.query(DoctorVisit).filter(
        and_(
            DoctorVisit.visit_date >= start_datetime,
            DoctorVisit.visit_date <= end_datetime
        )
    )
    if employee_id:
        doctor_visit_query = doctor_visit_query.filter(DoctorVisit.employee_id == employee_id)

    pharmacy_visit_query = db.query(PharmacyVisit).filter(
        and_(
            PharmacyVisit.visit_date >= start_datetime,
            PharmacyVisit.visit_date <= end_datetime
        )
    )
    if employee_id:
        pharmacy_visit_query = pharmacy_visit_query.filter(PharmacyVisit.employee_id == employee_id)

    doctor_visits = doctor_visit_query.count()
    pharmacy_visits = pharmacy_visit_query.count()
    total_visits = doctor_visits + pharmacy_visits

    # Satış istatistikleri (Eczane ziyaretlerinden product_count toplamı)
    product_count_query = db.query(func.sum(PharmacyVisit.product_count)).filter(
        and_(
            PharmacyVisit.visit_date >= start_date,
            PharmacyVisit.visit_date <= end_date
        )
    )
    if employee_id:
        product_count_query = product_count_query.filter(PharmacyVisit.employee_id == employee_id)

    total_sales = product_count_query.scalar() or 0

    # Gelir hesabı (şimdilik 0, ileride entegre edilecek)
    total_revenue = 0.0

    # Hedef durumu
    goal_query = db.query(Goal).filter(
        and_(
            Goal.start_date <= end_date,
            Goal.end_date >= start_date
        )
    )
    if employee_id:
        goal_query = goal_query.filter(Goal.employee_id == employee_id)

    current_goal = goal_query.first()

    goal_status = None
    if current_goal:
        visit_progress = (total_visits / float(current_goal.target_visits) * 100) if current_goal.target_visits > 0 else 0
        sales_progress = (total_revenue / float(current_goal.target_sales) * 100) if current_goal.target_sales > 0 else 0

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
            "open": 0,
            "in_progress": 0,
            "closed": 0,
            "total": 0
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
        date_trunc = func.date_trunc('day', DoctorVisit.visit_date)
    elif group_by == "week":
        date_trunc = func.date_trunc('week', DoctorVisit.visit_date)
    elif group_by == "month":
        date_trunc = func.date_trunc('month', DoctorVisit.visit_date)
    else:  # year
        date_trunc = func.date_trunc('year', DoctorVisit.visit_date)

    query = db.query(
        date_trunc.label('period'),
        func.count(DoctorVisit.id).label('count')
    ).filter(
        and_(
            DoctorVisit.visit_date >= start_datetime,
            DoctorVisit.visit_date <= end_datetime
        )
    )

    if employee_id:
        query = query.filter(DoctorVisit.employee_id == employee_id)

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
        func.count(DoctorVisit.id).label('visit_count'),
        func.count(Sale.id).label('sale_count'),
        func.coalesce(func.sum(Sale.total_amount), 0).label('total_revenue')
    ).outerjoin(
        DoctorVisit, and_(
            DoctorVisit.employee_id == Employee.id,
            DoctorVisit.visit_date >= start_datetime,
            DoctorVisit.visit_date <= end_datetime
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


@router.get("/week-star")
def get_week_star(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Haftanın yıldızı - En çok satış yapan çalışan (bu hafta)
    """
    today = date.today()
    weekday = today.weekday()
    if weekday == 6:  # Bugün pazar
        days_since_sunday = 0
    else:
        days_since_sunday = weekday + 1

    last_sunday = today - timedelta(days=days_since_sunday)
    start_datetime = datetime.combine(last_sunday, datetime.min.time())
    end_datetime = datetime.combine(today, datetime.max.time())

    # Bu hafta en çok product_count toplayan çalışan
    result = db.query(
        Employee.id,
        Employee.full_name,
        func.coalesce(func.sum(PharmacyVisit.product_count), 0).label('sales_count')
    ).join(
        PharmacyVisit, PharmacyVisit.employee_id == Employee.id
    ).filter(
        and_(
            Employee.role == EmployeeRole.EMPLOYEE,
            PharmacyVisit.visit_date >= start_datetime,
            PharmacyVisit.visit_date <= end_datetime
        )
    ).group_by(
        Employee.id, Employee.full_name
    ).order_by(
        func.sum(PharmacyVisit.product_count).desc()
    ).first()

    if not result:
        return {
            "employee_name": "Henüz veri yok",
            "sales_count": 0
        }

    return {
        "employee_id": result.id,
        "employee_name": result.full_name,
        "sales_count": int(result.sales_count)
    }


@router.get("/chart-data")
def get_chart_data(
    period: str = Query("month", regex="^(week|month|year)$"),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Grafik verisi - Ziyaret ve satış verileri birlikte
    """
    today = date.today()

    # Periyoda göre veri yapısını belirle
    if period == "week":
        # Son 5 iş günü (Pazartesi-Cuma)
        data = []
        days = ["Pzt", "Sal", "Çar", "Per", "Cum"]
        for i in range(4, -1, -1):
            day_date = today - timedelta(days=i)

            # O günün ziyaret sayısı
            visit_count = db.query(func.count(DoctorVisit.id)).filter(
                func.date(DoctorVisit.visit_date) == day_date
            ).scalar() or 0

            # O günün satış sayısı (product_count toplamı)
            sales_count = db.query(func.coalesce(func.sum(PharmacyVisit.product_count), 0)).filter(
                func.date(PharmacyVisit.visit_date) == day_date
            ).scalar() or 0

            data.append({
                "name": days[4-i],
                "ziyaret": visit_count,
                "satis": int(sales_count)
            })

    elif period == "month":
        # Son 4 hafta
        data = []
        for week_num in range(4, 0, -1):
            week_start = today - timedelta(days=(week_num * 7))
            week_end = week_start + timedelta(days=6)

            visit_count = db.query(func.count(DoctorVisit.id)).filter(
                and_(
                    DoctorVisit.visit_date >= datetime.combine(week_start, datetime.min.time()),
                    DoctorVisit.visit_date <= datetime.combine(week_end, datetime.max.time())
                )
            ).scalar() or 0

            sales_count = db.query(func.coalesce(func.sum(PharmacyVisit.product_count), 0)).filter(
                and_(
                    PharmacyVisit.visit_date >= datetime.combine(week_start, datetime.min.time()),
                    PharmacyVisit.visit_date <= datetime.combine(week_end, datetime.max.time())
                )
            ).scalar() or 0

            data.append({
                "name": f"Hafta {5-week_num}",
                "ziyaret": visit_count,
                "satis": int(sales_count)
            })

    else:  # year
        # Son 11 ay + bu ay (toplam 11 ay)
        data = []
        months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]

        for i in range(10, -1, -1):
            month_date = today - timedelta(days=i*30)
            month_num = month_date.month

            visit_count = db.query(func.count(DoctorVisit.id)).filter(
                and_(
                    extract('year', DoctorVisit.visit_date) == month_date.year,
                    extract('month', DoctorVisit.visit_date) == month_num
                )
            ).scalar() or 0

            sales_count = db.query(func.coalesce(func.sum(PharmacyVisit.product_count), 0)).filter(
                and_(
                    extract('year', PharmacyVisit.visit_date) == month_date.year,
                    extract('month', PharmacyVisit.visit_date) == month_num
                )
            ).scalar() or 0

            data.append({
                "name": months[month_num - 1],
                "ziyaret": visit_count,
                "satis": int(sales_count)
            })

    return data


@router.get("/doctor-visits-pie")
def get_doctor_visits_pie(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Hekim ziyaretleri pasta grafiği - Çalışan bazlı oranlar (bu ay)
    """
    today = date.today()
    start_date = today.replace(day=1)
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(today, datetime.max.time())

    # Çalışanlara göre hekim ziyareti sayıları
    results = db.query(
        Employee.full_name,
        func.count(DoctorVisit.id).label('visit_count')
    ).join(
        DoctorVisit, DoctorVisit.employee_id == Employee.id
    ).filter(
        and_(
            Employee.role == EmployeeRole.EMPLOYEE,
            DoctorVisit.visit_date >= start_datetime,
            DoctorVisit.visit_date <= end_datetime
        )
    ).group_by(
        Employee.id, Employee.full_name
    ).order_by(
        func.count(DoctorVisit.id).desc()
    ).all()

    return [
        {
            "name": r.full_name,
            "value": r.visit_count
        }
        for r in results
    ]


@router.get("/pharmacy-visits-pie")
def get_pharmacy_visits_pie(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Eczane ziyaretleri pasta grafiği - Çalışan bazlı oranlar (bu ay)
    """
    today = date.today()
    start_date = today.replace(day=1)
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(today, datetime.max.time())

    # Çalışanlara göre eczane ziyareti sayıları
    results = db.query(
        Employee.full_name,
        func.count(PharmacyVisit.id).label('visit_count')
    ).join(
        PharmacyVisit, PharmacyVisit.employee_id == Employee.id
    ).filter(
        and_(
            Employee.role == EmployeeRole.EMPLOYEE,
            PharmacyVisit.visit_date >= start_datetime,
            PharmacyVisit.visit_date <= end_datetime
        )
    ).group_by(
        Employee.id, Employee.full_name
    ).order_by(
        func.count(PharmacyVisit.id).desc()
    ).all()

    return [
        {
            "name": r.full_name,
            "value": r.visit_count
        }
        for r in results
    ]

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime, timedelta
from io import BytesIO
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

from ..database import get_db
from ..models.employee import Employee, EmployeeRole
from ..models.daily_report import DailyReport
from ..models.doctor_visit import DoctorVisit
from ..models.pharmacy_visit import PharmacyVisit
from ..models.sale import Sale
from ..schemas.report import DailyReportCreate, DailyReportUpdate, DailyReportResponse
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/daily", response_model=List[DailyReportResponse])
def get_daily_reports(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Retrieve daily reports
    """
    query = db.query(DailyReport)

    # Filter by employee if not admin
    if current_user.role.value != "admin":
        query = query.filter(DailyReport.employee_id == current_user.id)

    reports = query.order_by(DailyReport.report_date.desc()).offset(skip).limit(limit).all()
    return reports


@router.get("/daily/{report_date}", response_model=DailyReportResponse)
def get_daily_report(
    report_date: date,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Get daily report by date
    """
    report = db.query(DailyReport).filter(
        DailyReport.employee_id == current_user.id,
        DailyReport.report_date == report_date
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Daily report not found")

    return report


@router.post("/daily", response_model=DailyReportResponse)
def create_daily_report(
    report: DailyReportCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Create daily report with auto-calculated stats
    """
    # Check if report already exists for this date
    existing_report = db.query(DailyReport).filter(
        DailyReport.employee_id == current_user.id,
        DailyReport.report_date == report.report_date
    ).first()

    if existing_report:
        raise HTTPException(status_code=400, detail="Report already exists for this date")

    # Calculate stats
    start_datetime = datetime.combine(report.report_date, datetime.min.time())
    end_datetime = datetime.combine(report.report_date, datetime.max.time())

    # Count doctor and pharmacy visits
    doctor_visits = db.query(func.count(DoctorVisit.id)).filter(
        DoctorVisit.employee_id == current_user.id,
        DoctorVisit.visit_date >= start_datetime,
        DoctorVisit.visit_date <= end_datetime
    ).scalar() or 0

    pharmacy_visits = db.query(func.count(PharmacyVisit.id)).filter(
        PharmacyVisit.employee_id == current_user.id,
        PharmacyVisit.visit_date >= start_datetime,
        PharmacyVisit.visit_date <= end_datetime
    ).scalar() or 0

    total_visits = doctor_visits + pharmacy_visits

    total_sales = db.query(func.count(Sale.id)).filter(
        Sale.employee_id == current_user.id,
        Sale.sale_date >= start_datetime,
        Sale.sale_date <= end_datetime
    ).scalar()

    db_report = DailyReport(
        employee_id=current_user.id,
        total_visits=total_visits,
        total_sales=total_sales,
        **report.dict()
    )

    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report


@router.put("/daily/{report_id}", response_model=DailyReportResponse)
def update_daily_report(
    report_id: int,
    report_update: DailyReportUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Update daily report
    """
    db_report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Check permissions
    if current_user.role.value != "admin" and db_report.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this report")

    update_data = report_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_report, field, value)

    db.commit()
    db.refresh(db_report)
    return db_report


@router.get("/export")
def export_report(
    period: str = Query(..., description="day, week, month, or year"),
    employee: Optional[str] = Query(None, description="Employee name or 'all'"),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Export report data to Excel file
    """
    # Only managers can export reports
    if current_user.role != EmployeeRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can export reports")

    # Calculate date range based on period
    today = datetime.now().date()
    if period == 'day':
        start_date = today
        end_date = today
    elif period == 'week':
        start_date = today - timedelta(days=7)
        end_date = today
    elif period == 'month':
        start_date = today - timedelta(days=30)
        end_date = today
    elif period == 'year':
        start_date = today - timedelta(days=365)
        end_date = today
    else:
        raise HTTPException(status_code=400, detail="Invalid period")

    # For now, create mock data for demo
    # In production, this would query the actual database
    all_data = []

    # Mock doctor visits
    all_data.append({
        'date': '2025-11-24',
        'employee': 'Ahmet Kaya',
        'type': 'Doktor',
        'target': 'Dr. Mehmet Yılmaz',
        'specialty': 'Kardiyoloji',
        'hospital': 'Ankara Şehir Hastanesi',
        'start_time': '09:00',
        'end_time': '09:30',
        'status': 'Başarılı',
        'boxes_sold': 0,
        'boxes_gifted': 0,
        'feedback': 'Çok başarılı bir görüşme oldu.',
        'notes': 'Doktor ürünlerimizle ilgileniyor. Önümüzdeki ay tekrar ziyaret edilecek.'
    })

    all_data.append({
        'date': '2025-11-24',
        'employee': 'Ayşe Demir',
        'type': 'Doktor',
        'target': 'Dr. Zeynep Kara',
        'specialty': 'Nöroloji',
        'hospital': 'İstanbul Üniversitesi Hastanesi',
        'start_time': '14:00',
        'end_time': '14:45',
        'status': 'Başarılı',
        'boxes_sold': 0,
        'boxes_gifted': 0,
        'feedback': '',
        'notes': 'İlk görüşme. Bilgilendirme yapıldı.'
    })

    # Mock pharmacy visits
    all_data.append({
        'date': '2025-11-24',
        'employee': 'Ahmet Kaya',
        'type': 'Eczane',
        'target': 'Sağlık Eczanesi',
        'specialty': 'Eczacı Ali Veli',
        'hospital': 'Kızılay Cad. No:45 Ankara',
        'start_time': '10:00',
        'end_time': '10:30',
        'status': 'Anlaşma Sağlandı',
        'boxes_sold': 50,
        'boxes_gifted': 5,
        'feedback': 'Satış başarılı',
        'notes': 'Eczane ile anlaşma sağlandı, 50 kutu satış yapıldı.'
    })

    all_data.append({
        'date': '2025-11-23',
        'employee': 'Mehmet Öz',
        'type': 'Eczane',
        'target': 'Hayat Eczanesi',
        'specialty': 'Eczacı Fatma Şahin',
        'hospital': 'Atatürk Bulvarı No:123 İstanbul',
        'start_time': '15:00',
        'end_time': '15:20',
        'status': 'Anlaşma Sağlanamadı',
        'boxes_sold': 0,
        'boxes_gifted': 0,
        'feedback': 'Fiyat konusunda anlaşamadık',
        'notes': 'Eczacı başka tedarikçi ile çalışmak istiyor.'
    })

    # Create Excel workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Detaylı Rapor"

    # Header styling
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True, size=12)
    header_alignment = Alignment(horizontal="center", vertical="center")

    # Headers
    headers = [
        "Tarih", "Çalışan", "Tür", "Hedef Adı", "Uzmanlık/Eczacı", "Hastane/Adres",
        "Başlangıç", "Bitiş", "Durum", "Satılan Kutu", "Hediye Kutu",
        "Manager Geri Dönüşü", "Notlar"
    ]
    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = header_alignment

    # Data rows
    for row_num, data in enumerate(all_data, 2):
        ws.cell(row=row_num, column=1, value=data['date'])
        ws.cell(row=row_num, column=2, value=data['employee'])
        ws.cell(row=row_num, column=3, value=data['type'])
        ws.cell(row=row_num, column=4, value=data['target'])
        ws.cell(row=row_num, column=5, value=data['specialty'])
        ws.cell(row=row_num, column=6, value=data['hospital'])
        ws.cell(row=row_num, column=7, value=data['start_time'])
        ws.cell(row=row_num, column=8, value=data['end_time'])
        ws.cell(row=row_num, column=9, value=data['status'])
        ws.cell(row=row_num, column=10, value=data['boxes_sold'])
        ws.cell(row=row_num, column=11, value=data['boxes_gifted'])
        ws.cell(row=row_num, column=12, value=data['feedback'])
        ws.cell(row=row_num, column=13, value=data['notes'])

    # Adjust column widths
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column].width = adjusted_width

    # Save to BytesIO
    excel_file = BytesIO()
    wb.save(excel_file)
    excel_file.seek(0)

    # Return as streaming response
    filename = f"rapor_{period}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

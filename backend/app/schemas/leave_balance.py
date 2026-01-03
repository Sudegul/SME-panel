from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class LeaveBalanceResponse(BaseModel):
    id: int
    employee_id: int
    leave_type_id: int
    leave_type_name: str
    year: Optional[int] = None  # Eski sistem için (yakında kaldırılacak)
    service_year: Optional[int] = None  # Çalışanın kaçıncı yılı
    carried_over_days: int = 0  # Geçen yıldan taşınan
    current_year_entitlement: int = 0  # Bu yıl hak edilen
    total_days: int
    used_days: int
    remaining_days: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

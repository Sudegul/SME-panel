from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SaleBase(BaseModel):
    pharmacy_id: int
    product_name: str
    quantity: int
    unit_price: float
    sale_date: datetime
    notes: Optional[str] = None


class SaleCreate(SaleBase):
    pass


class SaleUpdate(BaseModel):
    pharmacy_id: Optional[int] = None
    product_name: Optional[str] = None
    quantity: Optional[int] = None
    unit_price: Optional[float] = None
    sale_date: Optional[datetime] = None
    notes: Optional[str] = None


class SaleResponse(SaleBase):
    id: int
    employee_id: int
    total_amount: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

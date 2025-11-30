from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from ..database import get_db
from ..models.employee import Employee
from ..models.sale import Sale
from ..schemas.sale import SaleCreate, SaleUpdate, SaleResponse
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.get("/", response_model=List[SaleResponse])
def get_sales(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Retrieve sales with optional date filtering
    """
    query = db.query(Sale)

    # Filter by employee if not admin
    if current_user.role.value != "admin":
        query = query.filter(Sale.employee_id == current_user.id)

    if start_date:
        query = query.filter(Sale.sale_date >= start_date)
    if end_date:
        query = query.filter(Sale.sale_date <= end_date)

    sales = query.offset(skip).limit(limit).all()
    return sales


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Get sale by ID
    """
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    # Check permissions
    if current_user.role.value != "admin" and sale.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this sale")

    return sale


@router.post("/", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Create new sale
    """
    # Calculate total amount
    total_amount = sale.quantity * sale.unit_price

    db_sale = Sale(
        employee_id=current_user.id,
        total_amount=total_amount,
        **sale.dict()
    )
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)
    return db_sale


@router.put("/{sale_id}", response_model=SaleResponse)
def update_sale(
    sale_id: int,
    sale_update: SaleUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Update sale
    """
    db_sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not db_sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    # Check permissions
    if current_user.role.value != "admin" and db_sale.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this sale")

    update_data = sale_update.dict(exclude_unset=True)

    # Recalculate total if quantity or unit_price changed
    if "quantity" in update_data or "unit_price" in update_data:
        quantity = update_data.get("quantity", db_sale.quantity)
        unit_price = update_data.get("unit_price", db_sale.unit_price)
        update_data["total_amount"] = quantity * unit_price

    for field, value in update_data.items():
        setattr(db_sale, field, value)

    db.commit()
    db.refresh(db_sale)
    return db_sale


@router.delete("/{sale_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Delete sale
    """
    db_sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not db_sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    # Check permissions
    if current_user.role.value != "admin" and db_sale.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this sale")

    db.delete(db_sale)
    db.commit()
    return None

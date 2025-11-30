from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from ..database import get_db
from ..models.employee import Employee
from ..models.visit import Visit
from ..schemas.visit import VisitCreate, VisitUpdate, VisitResponse
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/visits", tags=["Visits"])


@router.get("/", response_model=List[VisitResponse])
def get_visits(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Retrieve visits with optional date filtering
    """
    query = db.query(Visit)

    # Filter by employee if not admin
    if current_user.role.value != "admin":
        query = query.filter(Visit.employee_id == current_user.id)

    if start_date:
        query = query.filter(Visit.visit_date >= start_date)
    if end_date:
        query = query.filter(Visit.visit_date <= end_date)

    visits = query.offset(skip).limit(limit).all()
    return visits


@router.get("/{visit_id}", response_model=VisitResponse)
def get_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Get visit by ID
    """
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    # Check permissions
    if current_user.role.value != "admin" and visit.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this visit")

    return visit


@router.post("/", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
def create_visit(
    visit: VisitCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Create new visit
    """
    db_visit = Visit(
        employee_id=current_user.id,
        **visit.dict()
    )
    db.add(db_visit)
    db.commit()
    db.refresh(db_visit)
    return db_visit


@router.put("/{visit_id}", response_model=VisitResponse)
def update_visit(
    visit_id: int,
    visit_update: VisitUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Update visit
    """
    db_visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not db_visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    # Check permissions
    if current_user.role.value != "admin" and db_visit.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this visit")

    update_data = visit_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_visit, field, value)

    db.commit()
    db.refresh(db_visit)
    return db_visit


@router.delete("/{visit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Delete visit
    """
    db_visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not db_visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    # Check permissions
    if current_user.role.value != "admin" and db_visit.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this visit")

    db.delete(db_visit)
    db.commit()
    return None

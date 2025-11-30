from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.employee import Employee
from ..models.case import Case
from ..schemas.case import CaseCreate, CaseUpdate, CaseResponse
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/cases", tags=["Cases"])


@router.get("/", response_model=List[CaseResponse])
def get_cases(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Retrieve cases
    """
    query = db.query(Case)

    # Filter by employee if not admin
    if current_user.role.value != "admin":
        query = query.filter(Case.employee_id == current_user.id)

    cases = query.offset(skip).limit(limit).all()
    return cases


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Get case by ID
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Check permissions
    if current_user.role.value != "admin" and case.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this case")

    return case


@router.post("/", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(
    case: CaseCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Create new case
    """
    db_case = Case(
        employee_id=current_user.id,
        **case.dict()
    )
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    return db_case


@router.put("/{case_id}", response_model=CaseResponse)
def update_case(
    case_id: int,
    case_update: CaseUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Update case
    """
    db_case = db.query(Case).filter(Case.id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Check permissions
    if current_user.role.value != "admin" and db_case.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this case")

    update_data = case_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_case, field, value)

    db.commit()
    db.refresh(db_case)
    return db_case


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Delete case
    """
    db_case = db.query(Case).filter(Case.id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Check permissions
    if current_user.role.value != "admin" and db_case.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this case")

    db.delete(db_case)
    db.commit()
    return None

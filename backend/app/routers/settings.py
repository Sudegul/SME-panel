from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.employee import Employee, EmployeeRole
from ..models.settings import VisitColorScale
from ..schemas.settings import VisitColorScaleCreate, VisitColorScaleUpdate, VisitColorScaleResponse
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/visit-color-scales", response_model=List[VisitColorScaleResponse])
def get_visit_color_scales(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Get all visit color scale settings
    """
    scales = db.query(VisitColorScale).order_by(VisitColorScale.min_visits).all()

    # If no settings exist, create defaults
    if not scales:
        defaults = [
            VisitColorScale(color='yellow', min_visits=0, max_visits=14),
            VisitColorScale(color='orange', min_visits=15, max_visits=19),
            VisitColorScale(color='green', min_visits=20, max_visits=None),
        ]
        db.add_all(defaults)
        db.commit()
        for d in defaults:
            db.refresh(d)
        scales = defaults

    return scales


@router.put("/visit-color-scales", response_model=List[VisitColorScaleResponse])
def update_visit_color_scales(
    updates: List[VisitColorScaleCreate],
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Update all visit color scale settings at once
    Only MANAGER can update
    """
    # Check permission
    if current_user.role not in [EmployeeRole.MANAGER, EmployeeRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only MANAGER or ADMIN can update color scales")

    # Validate: must have exactly 3 colors
    if len(updates) != 3:
        raise HTTPException(status_code=400, detail="Must provide exactly 3 color scales (yellow, orange, green)")

    # Validate: colors must be yellow, orange, green
    colors = {u.color for u in updates}
    required_colors = {'yellow', 'orange', 'green'}
    if colors != required_colors:
        raise HTTPException(status_code=400, detail=f"Must include colors: {required_colors}")

    # Sort updates by min_visits
    sorted_updates = sorted(updates, key=lambda x: x.min_visits)

    # Validate ranges don't overlap and are continuous
    for i, update in enumerate(sorted_updates):
        # First range must start at 0
        if i == 0 and update.min_visits != 0:
            raise HTTPException(status_code=400, detail="İlk renk skalası 0'dan başlamalıdır")

        # Check if ranges overlap or have gaps
        if i > 0:
            prev_update = sorted_updates[i - 1]
            if prev_update.max_visits is None:
                raise HTTPException(status_code=400, detail="Sadece son renk skalası sınırsız olabilir")
            if update.min_visits != prev_update.max_visits + 1:
                raise HTTPException(
                    status_code=400,
                    detail=f"Renk skalaları arasında boşluk veya çakışma var. {prev_update.color} skalası {prev_update.max_visits}'de bitiyor, {update.color} skalası {update.min_visits}'de başlıyor."
                )

        # Last range should have no max
        if i == len(sorted_updates) - 1:
            if update.max_visits is not None:
                raise HTTPException(status_code=400, detail="Son renk skalası sınırsız olmalıdır (max_visits: null)")

    # Delete existing scales
    db.query(VisitColorScale).delete()

    # Create new scales
    new_scales = []
    for update in sorted_updates:
        scale = VisitColorScale(
            color=update.color,
            min_visits=update.min_visits,
            max_visits=update.max_visits
        )
        db.add(scale)
        new_scales.append(scale)

    db.commit()
    for scale in new_scales:
        db.refresh(scale)

    return new_scales


@router.post("/reset-password/{user_id}")
def reset_user_password(
    user_id: int,
    new_password: str,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Reset a user's password
    Only MANAGER or ADMIN can reset passwords
    """
    from passlib.context import CryptContext

    # Check permission
    if current_user.role not in [EmployeeRole.MANAGER, EmployeeRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only MANAGER or ADMIN can reset passwords")

    # Get target user
    target_user = db.query(Employee).filter(Employee.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Hash new password
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed_password = pwd_context.hash(new_password)

    # Update password
    target_user.hashed_password = hashed_password
    db.commit()

    return {"message": f"Password reset successfully for {target_user.full_name}"}

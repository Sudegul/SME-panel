from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.employee import Employee
from ..models.goal import Goal
from ..schemas.goal import GoalCreate, GoalUpdate, GoalResponse
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/goals", tags=["Goals"])


@router.get("/", response_model=List[GoalResponse])
def get_goals(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Retrieve goals
    """
    query = db.query(Goal)

    # Filter by employee if not admin
    if current_user.role.value != "admin":
        query = query.filter(Goal.employee_id == current_user.id)

    goals = query.offset(skip).limit(limit).all()
    return goals


@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Get goal by ID
    """
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Check permissions
    if current_user.role.value != "admin" and goal.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this goal")

    return goal


@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal: GoalCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Create new goal
    """
    db_goal = Goal(
        employee_id=current_user.id,
        **goal.dict()
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Update goal
    """
    db_goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Check permissions
    if current_user.role.value != "admin" and db_goal.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this goal")

    update_data = goal_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_goal, field, value)

    db.commit()
    db.refresh(db_goal)
    return db_goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Delete goal
    """
    db_goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Check permissions
    if current_user.role.value != "admin" and db_goal.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this goal")

    db.delete(db_goal)
    db.commit()
    return None

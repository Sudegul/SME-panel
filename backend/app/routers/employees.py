from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.employee import Employee
from ..schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from ..utils.dependencies import get_current_user, get_current_admin_user
from ..utils.auth import get_password_hash

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("/", response_model=List[EmployeeResponse])
def get_employees(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Retrieve employees
    """
    employees = db.query(Employee).offset(skip).limit(limit).all()
    return employees


@router.get("/me", response_model=EmployeeResponse)
def get_current_employee(current_user: Employee = Depends(get_current_user)):
    """
    Get current logged in employee
    """
    return current_user


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Get employee by ID
    """
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_admin_user)
):
    """
    Create new employee (Admin only)
    """
    # Check if email already exists
    if db.query(Employee).filter(Employee.email == employee.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    db_employee = Employee(
        email=employee.email,
        hashed_password=get_password_hash(employee.password),
        full_name=employee.full_name,
        role=employee.role,
        phone=employee.phone,
        hire_date=employee.hire_date,
    )
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    employee_update: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_admin_user)
):
    """
    Update employee (Admin only)
    """
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = employee_update.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(db_employee, field, value)

    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.post("/verify-password", response_model=dict)
def verify_manager_password(
    password: str,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_admin_user)
):
    """
    Verify manager's password for critical operations
    """
    from ..utils.auth import verify_password

    if not verify_password(password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect password")

    return {"verified": True}


@router.patch("/{employee_id}/deactivate", response_model=EmployeeResponse)
def deactivate_employee(
    employee_id: int,
    manager_password: str,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_admin_user)
):
    """
    Deactivate employee (Soft delete - Admin/Manager only)
    Kullanıcı silinmez, sadece is_active=False yapılır.
    Bu sayede tüm geçmiş verileri korunur ama artık giriş yapamaz.
    Manager şifresi doğrulaması gerektirir.
    """
    from ..utils.auth import verify_password

    # Verify manager password
    if not verify_password(manager_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect manager password")

    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if db_employee.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    db_employee.is_active = False
    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.patch("/{employee_id}/activate", response_model=EmployeeResponse)
def activate_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_admin_user)
):
    """
    Activate employee (Admin/Manager only)
    Pasif kullanıcıyı tekrar aktif yapar.
    """
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    db_employee.is_active = True
    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.patch("/{employee_id}/change-role", response_model=EmployeeResponse)
def change_employee_role(
    employee_id: int,
    new_role: str,
    manager_password: str,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_admin_user)
):
    """
    Change employee role (MANAGER ONLY - not ADMIN)
    Requires manager password verification.
    Only MANAGER can change roles, ADMIN cannot.
    """
    from ..utils.auth import verify_password
    from ..models.employee import EmployeeRole

    # Only MANAGER can change roles, not ADMIN
    if current_user.role != EmployeeRole.MANAGER:
        raise HTTPException(
            status_code=403,
            detail="Only MANAGER can change user roles. ADMIN cannot change roles."
        )

    # Verify manager password
    if not verify_password(manager_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect manager password")

    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if db_employee.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    # Validate role
    try:
        role_enum = EmployeeRole(new_role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")

    db_employee.role = role_enum
    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.post("/change-password", response_model=dict)
def change_password(
    current_password: str,
    new_password: str,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Change password for current user
    """
    from ..utils.auth import verify_password

    # Verify current password
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    # Hash and update new password
    current_user.hashed_password = get_password_hash(new_password)
    db.commit()

    return {"message": "Password changed successfully"}


@router.patch("/{employee_id}/permissions", response_model=EmployeeResponse)
def update_employee_permissions(
    employee_id: int,
    permissions: dict,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Update employee permissions (MANAGER only)
    Manager can grant/revoke permissions to ADMIN users
    """
    from ..models.employee import EmployeeRole
    from ..utils.dependencies import can_manage_user_permissions

    # Only MANAGER can update permissions
    if not can_manage_user_permissions(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only MANAGER can manage user permissions"
        )

    # Get target employee
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Cannot modify MANAGER's permissions
    if db_employee.role == EmployeeRole.MANAGER:
        raise HTTPException(
            status_code=400,
            detail="Cannot modify MANAGER's permissions. MANAGER always has full access."
        )

    # Validate permissions structure
    valid_permissions = {
        "view_all_leaves",
        "view_all_daily_reports",
        "view_all_weekly_plans",
        "approve_leaves",
        "manage_leave_types",
        "manage_roles",
        "manage_performance_scale",
        "dashboard_full_access"
    }

    for key in permissions.keys():
        if key not in valid_permissions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid permission key: {key}"
            )

    # İzin onaylama yetkisi veriliyorsa, tüm izinleri görme yetkisini de otomatik ver
    if permissions.get("approve_leaves") is True:
        permissions["view_all_leaves"] = True

    # Update permissions
    db_employee.permissions = permissions
    db.commit()
    db.refresh(db_employee)

    return db_employee

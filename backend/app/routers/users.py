import math
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.user import User, UserPlant
from app.models.role import Role
from app.models.department import Department
from app.models.plant import Plant
from app.models.audit import AuditLog, LoginActivity
from app.auth.security import get_password_hash
from app.auth.dependencies import get_current_user, require_super_admin, require_department_access
from app.services.audit_service import record_audit_log
from app.schemas.user import (
    UserCreate, UserUpdate, UserStatusUpdate, ResetPasswordRequest
)
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/users", tags=["Users Management"])

USER_MANAGEMENT_ROLES = ["SUPER_ADMIN", "HR_MANAGER"]

def serialize_user(u: User) -> dict:
    plants = []
    if u.plants:
        for up in u.plants:
            if up.plant:
                plants.append({
                    "plant_id": up.plant.id,
                    "is_primary": up.is_primary,
                    "plant_name": up.plant.name
                })
    return {
        "id": u.id,
        "employee_id": u.employee_id,
        "first_name": u.first_name,
        "last_name": u.last_name,
        "full_name": u.full_name,
        "email": u.email,
        "phone": u.phone,
        "department_id": u.department_id,
        "department_name": u.department.name if u.department else None,
        "role_id": u.role_id,
        "role_name": u.role.name if u.role else None,
        "designation": u.designation,
        "status": u.status,
        "avatar_url": u.avatar_url,
        "plants": plants,
        "last_login": u.last_login,
        "created_at": u.created_at
    }

@router.get("")
def list_users(
    search: Optional[str] = None,
    department_id: Optional[str] = None,
    role_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    plant_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(User)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.first_name.ilike(s),
                User.last_name.ilike(s),
                User.email.ilike(s),
                User.employee_id.ilike(s),
                User.phone.ilike(s)
            )
        )

    if department_id:
        query = query.filter(User.department_id == department_id)

    if role_id:
        query = query.filter(User.role_id == role_id)

    if status_filter and status_filter != "ALL":
        query = query.filter(User.status == status_filter.upper())

    if plant_id:
        query = query.join(UserPlant).filter(UserPlant.plant_id == plant_id)

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return {
        "items": [serialize_user(u) for u in users],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.get("/{user_id}")
def get_user_detail(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    base_data = serialize_user(user)

    # Permissions from role
    permissions = []
    if user.role and user.role.permissions:
        for perm in user.role.permissions:
            permissions.append({
                "module": perm.module,
                "can_view": perm.can_view,
                "can_create": perm.can_create,
                "can_edit": perm.can_edit,
                "can_delete": perm.can_delete,
                "can_approve": perm.can_approve,
                "can_export": perm.can_export,
            })

    # Recent activity
    recent_activity = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == user.id)
        .order_by(AuditLog.created_at.desc())
        .limit(10)
        .all()
    )
    activity_data = [
        {
            "id": a.id,
            "module": a.module,
            "action": a.action,
            "description": a.description,
            "created_at": a.created_at,
            "status": a.status
        }
        for a in recent_activity
    ]

    # Login history
    login_history = (
        db.query(LoginActivity)
        .filter(LoginActivity.user_id == user.id)
        .order_by(LoginActivity.login_time.desc())
        .limit(10)
        .all()
    )
    login_data = [
        {
            "id": lh.id,
            "ip_address": lh.ip_address,
            "device": lh.device,
            "browser": lh.browser,
            "status": lh.status,
            "login_time": lh.login_time,
            "logout_time": lh.logout_time
        }
        for lh in login_history
    ]

    base_data["permissions"] = permissions
    base_data["recent_activity"] = activity_data
    base_data["login_history"] = login_data
    return base_data

@router.post("", status_code=status.HTTP_201_CREATED)
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_department_access(USER_MANAGEMENT_ROLES, "HR / User Management"))
):
    # Check duplicate email
    if db.query(User).filter(User.email.ilike(body.email.strip())).first():
        raise HTTPException(status_code=400, detail="Email address is already in use")

    # Check duplicate employee ID
    if db.query(User).filter(User.employee_id.ilike(body.employee_id.strip())).first():
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    # Verify role
    role = db.query(Role).filter(Role.id == body.role_id).first()
    if not role:
        raise HTTPException(status_code=400, detail="Specified Role does not exist")

    # Create user
    new_user = User(
        employee_id=body.employee_id.strip(),
        first_name=body.first_name.strip(),
        last_name=body.last_name.strip(),
        email=body.email.strip().lower(),
        phone=body.phone.strip() if body.phone else None,
        password_hash=get_password_hash(body.password),
        department_id=body.department_id,
        role_id=body.role_id,
        designation=body.designation,
        status=body.status or "ACTIVE",
        avatar_url=body.avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={body.first_name}+{body.last_name}"
    )
    db.add(new_user)
    db.flush()

    # Assign plants
    if body.plant_ids:
        for idx, p_id in enumerate(body.plant_ids):
            plant_link = UserPlant(
                user_id=new_user.id,
                plant_id=p_id,
                is_primary=(idx == 0)
            )
            db.add(plant_link)

    db.commit()
    db.refresh(new_user)

    record_audit_log(
        db=db,
        module="USERS",
        action="CREATE",
        description=f"Created user {new_user.full_name} ({new_user.employee_id}) with role {role.name}",
        user_name=current_user.full_name,
        user_id=current_user.id,
        record_id=new_user.id,
        record_title=new_user.full_name
    )

    return serialize_user(new_user)

@router.put("/{user_id}")
def update_user(
    user_id: str,
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_department_access(USER_MANAGEMENT_ROLES, "HR / User Management"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Only Super Admin can change user roles
    is_super = (current_user.role and current_user.role.code == "SUPER_ADMIN") or current_user.email == "admin@loomora.com"
    if body.role_id is not None and body.role_id != user.role_id and not is_super:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only Super Administrator can reassign user roles."
        )

    if body.email and body.email.strip().lower() != user.email:
        existing = db.query(User).filter(User.email.ilike(body.email.strip())).first()
        if existing and existing.id != user.id:
            raise HTTPException(status_code=400, detail="Email is already used by another user")
        user.email = body.email.strip().lower()

    if body.first_name is not None:
        user.first_name = body.first_name.strip()
    if body.last_name is not None:
        user.last_name = body.last_name.strip()
    if body.phone is not None:
        user.phone = body.phone.strip()
    if body.department_id is not None:
        user.department_id = body.department_id
    if body.role_id is not None and is_super:
        user.role_id = body.role_id
    if body.designation is not None:
        user.designation = body.designation
    if body.status is not None and is_super:
        user.status = body.status
    if body.avatar_url is not None:
        user.avatar_url = body.avatar_url

    if body.plant_ids is not None:
        db.query(UserPlant).filter(UserPlant.user_id == user.id).delete()
        for idx, p_id in enumerate(body.plant_ids):
            plant_link = UserPlant(
                user_id=user.id,
                plant_id=p_id,
                is_primary=(idx == 0)
            )
            db.add(plant_link)

    db.commit()
    db.refresh(user)

    record_audit_log(
        db=db,
        module="USERS",
        action="UPDATE",
        description=f"Updated profile for user {user.full_name} ({user.employee_id})",
        user_name=current_user.full_name,
        user_id=current_user.id,
        record_id=user.id,
        record_title=user.full_name
    )

    return serialize_user(user)

@router.patch("/{user_id}/status")
def update_user_status(
    user_id: str,
    body: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_status = user.status
    user.status = body.status.upper()
    db.commit()

    record_audit_log(
        db=db,
        module="USERS",
        action="STATUS_CHANGE",
        description=f"Changed user {user.full_name} status from {old_status} to {user.status}",
        user_name=current_user.full_name,
        user_id=current_user.id,
        record_id=user.id,
        record_title=user.full_name
    )

    return {"message": f"User status changed to {user.status}", "user": serialize_user(user)}

@router.post("/{user_id}/reset-password", response_model=MessageResponse)
def reset_password(
    user_id: str,
    body: ResetPasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user.password_hash = get_password_hash(body.new_password)
    db.commit()

    record_audit_log(
        db=db,
        module="USERS",
        action="RESET_PASSWORD",
        description=f"Administrator reset password for user {user.full_name}",
        user_name=current_user.full_name,
        user_id=current_user.id,
        record_id=user.id,
        record_title=user.full_name
    )

    return {"message": "Password has been successfully reset", "success": True}

@router.delete("/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    name = user.full_name
    emp_id = user.employee_id
    uid = user.id

    # Clean up dependent associations
    from app.models.audit import AuditLog, LoginActivity, UserApproval
    from app.models.user import UserPlant
    from app.models.operations import ProductionOrder

    db.query(AuditLog).filter(AuditLog.user_id == uid).update({"user_id": None})
    db.query(LoginActivity).filter(LoginActivity.user_id == uid).update({"user_id": None})
    db.query(UserApproval).filter(UserApproval.user_id == uid).delete()
    db.query(UserPlant).filter(UserPlant.user_id == uid).delete()
    db.query(ProductionOrder).filter(ProductionOrder.artisan_id == uid).update({"artisan_id": None})

    record_audit_log(
        db=db,
        module="USERS",
        action="DELETE",
        description=f"Deleted user {name} ({emp_id})",
        user_name=current_user.full_name,
        user_id=current_user.id,
        record_id=uid,
        record_title=name
    )

    db.delete(user)
    db.commit()

    return {"message": f"User {name} has been deleted successfully", "success": True}

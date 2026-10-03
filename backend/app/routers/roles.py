from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.role import Role, RolePermission
from app.models.user import User
from app.auth.dependencies import get_current_user, require_super_admin
from app.services.audit_service import record_audit_log
from app.schemas.role import RoleCreate, RoleUpdate
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/roles", tags=["Roles & Permissions"])

MODULES = [
    "DASHBOARD",
    "USERS",
    "ROLES",
    "DEPARTMENTS",
    "PLANTS",
    "MASTER_DATA",
    "PRODUCTION",
    "INVENTORY",
    "PURCHASE",
    "SALES",
    "QUALITY",
    "REPORTS",
    "SETTINGS"
]
MODULE_ORDER = {m: i for i, m in enumerate(MODULES)}

def serialize_role(role: Role) -> dict:
    perms = [
        {
            "id": p.id,
            "module": p.module,
            "can_view": bool(p.can_view),
            "can_create": bool(p.can_create),
            "can_edit": bool(p.can_edit),
            "can_delete": bool(p.can_delete),
            "can_approve": bool(p.can_approve),
            "can_export": bool(p.can_export)
        }
        for p in sorted(role.permissions, key=lambda x: MODULE_ORDER.get(x.module.upper(), 99))
    ]
    return {
        "id": role.id,
        "name": role.name,
        "code": role.code,
        "description": role.description,
        "is_system": role.is_system,
        "permissions": perms,
        "user_count": len(role.users) if role.users else 0,
        "created_at": role.created_at
    }

@router.get("")
def list_roles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    roles = db.query(Role).order_by(Role.is_system.desc(), Role.name.asc()).all()
    return [serialize_role(r) for r in roles]

@router.get("/{role_id}")
def get_role(role_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return serialize_role(role)

@router.post("", status_code=status.HTTP_201_CREATED)
def create_role(
    body: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    existing_name = db.query(Role).filter(Role.name.ilike(body.name.strip())).first()
    if existing_name:
        raise HTTPException(status_code=400, detail="A role with this name already exists")

    existing_code = db.query(Role).filter(Role.code.ilike(body.code.strip())).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="A role with this code already exists")

    new_role = Role(
        name=body.name.strip(),
        code=body.code.strip().upper(),
        description=body.description,
        is_system=False
    )
    db.add(new_role)
    db.flush()

    # Create permissions
    module_perm_map = {p.module.upper(): p for p in (body.permissions or [])}
    for mod in MODULES:
        perm_data = module_perm_map.get(mod)
        p = RolePermission(
            role_id=new_role.id,
            module=mod,
            can_view=perm_data.can_view if perm_data else True,
            can_create=perm_data.can_create if perm_data else False,
            can_edit=perm_data.can_edit if perm_data else False,
            can_delete=perm_data.can_delete if perm_data else False,
            can_approve=perm_data.can_approve if perm_data else False,
            can_export=perm_data.can_export if perm_data else False,
        )
        db.add(p)

    db.commit()
    db.refresh(new_role)

    record_audit_log(
        db=db,
        module="ROLES",
        action="CREATE",
        description=f"Created role '{new_role.name}' with custom permissions",
        user_name=current_user.full_name,
        user_id=current_user.id,
        record_id=new_role.id,
        record_title=new_role.name
    )

    return serialize_role(new_role)

@router.put("/{role_id}")
def update_role(
    role_id: str,
    body: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if body.name is not None:
        role.name = body.name.strip()
    if body.description is not None:
        role.description = body.description

    if body.permissions is not None:
        # Update permissions matrix
        existing_perms = {p.module.upper(): p for p in role.permissions}
        for item in body.permissions:
            mod = item.module.upper()
            if mod in existing_perms:
                p = existing_perms[mod]
                p.can_view = bool(item.can_view)
                p.can_create = bool(item.can_create)
                p.can_edit = bool(item.can_edit)
                p.can_delete = bool(item.can_delete)
                p.can_approve = bool(item.can_approve)
                p.can_export = bool(item.can_export)
            else:
                p = RolePermission(
                    role_id=role.id,
                     module=mod,
                     can_view=bool(item.can_view),
                     can_create=bool(item.can_create),
                     can_edit=bool(item.can_edit),
                     can_delete=bool(item.can_delete),
                     can_approve=bool(item.can_approve),
                     can_export=bool(item.can_export)
                )
                db.add(p)

    db.commit()
    db.refresh(role)

    record_audit_log(
        db=db,
        module="ROLES",
        action="UPDATE",
        description=f"Updated permissions matrix for role '{role.name}'",
        user_name=current_user.full_name,
        user_id=current_user.id,
        record_id=role.id,
        record_title=role.name
    )

    return serialize_role(role)

@router.delete("/{role_id}", response_model=MessageResponse)
def delete_role(
    role_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role.is_system:
        raise HTTPException(status_code=400, detail="System default roles cannot be deleted")

    user_count = db.query(User).filter(User.role_id == role.id).count()
    if user_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete role '{role.name}' because it is assigned to {user_count} users. Reassign users first."
        )

    role_name = role.name
    db.delete(role)
    db.commit()

    record_audit_log(
        db=db,
        module="ROLES",
        action="DELETE",
        description=f"Deleted role '{role_name}'",
        user_name=current_user.full_name,
        user_id=current_user.id,
        record_id=role_id,
        record_title=role_name
    )

    return {"message": f"Role '{role_name}' deleted successfully", "success": True}

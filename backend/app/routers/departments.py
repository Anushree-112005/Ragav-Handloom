from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.department import Department
from app.models.plant import Plant
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.services.audit_service import record_audit_log
from app.schemas.department import DepartmentCreate, DepartmentUpdate
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/departments", tags=["Department Management"])

def serialize_department(dept: Department) -> dict:
    return {
        "id": dept.id,
        "code": dept.code,
        "name": dept.name,
        "description": dept.description,
        "department_head": dept.department_head,
        "plant_id": dept.plant_id,
        "plant_name": dept.plant.name if dept.plant else None,
        "status": dept.status,
        "user_count": len(dept.users) if dept.users else 0,
        "created_at": dept.created_at
    }

@router.get("")
def list_departments(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Department)
    if status and status != "ALL":
        query = query.filter(Department.status == status.upper())
    departments = query.order_by(Department.name.asc()).all()
    return [serialize_department(d) for d in departments]

@router.post("", status_code=status.HTTP_201_CREATED)
def create_department(
    body: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Department).filter(Department.code.ilike(body.code.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department code already exists")

    dept = Department(
        code=body.code.strip().upper(),
        name=body.name.strip(),
        description=body.description,
        department_head=body.department_head,
        plant_id=body.plant_id,
        status=body.status or "ACTIVE"
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)

    record_audit_log(
        db=db,
        module="DEPARTMENTS",
        action="CREATE",
        description=f"Created department '{dept.name}' ({dept.code})",
        user_name=current_user.full_name,
        user_id=current_user.id,
        record_id=dept.id,
        record_title=dept.name
    )

    return serialize_department(dept)

@router.put("/{dept_id}")
def update_department(
    dept_id: str,
    body: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    if body.code is not None:
        dept.code = body.code.strip().upper()
    if body.name is not None:
        dept.name = body.name.strip()
    if body.description is not None:
        dept.description = body.description
    if body.department_head is not None:
        dept.department_head = body.department_head
    if body.plant_id is not None:
        dept.plant_id = body.plant_id
    if body.status is not None:
        dept.status = body.status

    db.commit()
    db.refresh(dept)

    record_audit_log(
        db=db,
        module="DEPARTMENTS",
        action="UPDATE",
        description=f"Updated department '{dept.name}' ({dept.code})",
        user_name=current_user.full_name,
        user_id=current_user.id,
        record_id=dept.id,
        record_title=dept.name
    )

    return serialize_department(dept)

@router.delete("/{dept_id}", response_model=MessageResponse)
def delete_department(
    dept_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    name = dept.name

    # Unassign users and artisans from this department
    from app.models.user import User as UserModel
    from app.models.master_data import Artisan
    db.query(UserModel).filter(UserModel.department_id == dept.id).update({"department_id": None})
    db.query(Artisan).filter(Artisan.department_id == dept.id).update({"department_id": None})

    db.delete(dept)
    db.commit()

    record_audit_log(
        db=db,
        module="DEPARTMENTS",
        action="DELETE",
        description=f"Deleted department '{name}'",
        user_name=current_user.full_name,
        user_id=current_user.id,
        record_id=dept_id,
        record_title=name
    )

    return {"message": f"Department '{name}' deleted successfully", "success": True}

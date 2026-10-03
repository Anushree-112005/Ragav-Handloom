from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.master_data import Loom
from app.models.plant import Plant
from app.models.user import User
from app.auth.dependencies import get_current_user, require_department_access
from app.services.audit_service import record_audit_log
from app.schemas.master_data import LoomCreate, LoomUpdate
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/looms", tags=["Loom Master"])

LOOM_ROLES = ["SUPER_ADMIN", "PROD_MANAGER", "PROD_SUPERVISOR"]

def serialize_loom(l: Loom) -> dict:
    return {
        "id": l.id,
        "loom_number": l.loom_number,
        "loom_type": l.loom_type,
        "plant_id": l.plant_id,
        "plant_name": l.plant.name if l.plant else None,
        "location": l.location,
        "capacity_meters_per_day": l.capacity_meters_per_day,
        "width_inches": l.width_inches,
        "assigned_artisan_id": l.assigned_artisan_id,
        "artisan_name": l.assigned_artisan.name if l.assigned_artisan else None,
        "installation_date": l.installation_date,
        "last_maintenance_date": l.last_maintenance_date,
        "status": l.status,
        "created_at": l.created_at
    }

@router.get("")
def list_looms(
    search: Optional[str] = None,
    loom_type: Optional[str] = None,
    plant_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Loom)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Loom.loom_number.ilike(s)) | (Loom.loom_type.ilike(s)) | (Loom.location.ilike(s)))
    if loom_type and loom_type != "ALL":
        query = query.filter(Loom.loom_type == loom_type)
    if plant_id:
        query = query.filter(Loom.plant_id == plant_id)
    if status and status != "ALL":
        query = query.filter(Loom.status == status.upper())
    looms = query.order_by(Loom.loom_number.asc()).all()
    return [serialize_loom(l) for l in looms]

@router.post("", status_code=status.HTTP_201_CREATED)
def create_loom(
    body: LoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_department_access(LOOM_ROLES, "Production"))
):
    if db.query(Loom).filter(Loom.loom_number.ilike(body.loom_number.strip())).first():
        raise HTTPException(status_code=400, detail="Loom number already exists")
    l = Loom(
        loom_number=body.loom_number.strip().upper(),
        loom_type=body.loom_type,
        plant_id=body.plant_id,
        location=body.location,
        capacity_meters_per_day=body.capacity_meters_per_day,
        width_inches=body.width_inches,
        assigned_artisan_id=body.assigned_artisan_id,
        installation_date=body.installation_date,
        last_maintenance_date=body.last_maintenance_date,
        status=body.status or "RUNNING"
    )
    db.add(l)
    db.commit()
    db.refresh(l)
    record_audit_log(
        db=db, module="LOOMS", action="CREATE",
        description=f"Added loom '{l.loom_number}' ({l.loom_type})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=l.id, record_title=l.loom_number
    )
    return serialize_loom(l)

@router.put("/{loom_id}")
def update_loom(
    loom_id: str,
    body: LoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_department_access(LOOM_ROLES, "Production"))
):
    l = db.query(Loom).filter(Loom.id == loom_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Loom not found")
    if body.loom_number:
        l.loom_number = body.loom_number.strip().upper()
    if body.loom_type:
        l.loom_type = body.loom_type
    if body.plant_id is not None:
        l.plant_id = body.plant_id
    if body.location is not None:
        l.location = body.location
    if body.capacity_meters_per_day is not None:
        l.capacity_meters_per_day = body.capacity_meters_per_day
    if body.width_inches is not None:
        l.width_inches = body.width_inches
    if body.assigned_artisan_id is not None:
        l.assigned_artisan_id = body.assigned_artisan_id
    if body.installation_date is not None:
        l.installation_date = body.installation_date
    if body.last_maintenance_date is not None:
        l.last_maintenance_date = body.last_maintenance_date
    if body.status:
        l.status = body.status

    db.commit()
    db.refresh(l)
    record_audit_log(
        db=db, module="LOOMS", action="UPDATE",
        description=f"Updated loom '{l.loom_number}' ({l.status})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=l.id, record_title=l.loom_number
    )
    return serialize_loom(l)

@router.delete("/{loom_id}", response_model=MessageResponse)
def delete_loom(
    loom_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_department_access(LOOM_ROLES, "Production"))
):
    l = db.query(Loom).filter(Loom.id == loom_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Loom not found")
    number = l.loom_number

    # Clear references in production orders
    from app.models.operations import ProductionOrder
    db.query(ProductionOrder).filter(ProductionOrder.loom_id == l.id).update({"loom_id": None})

    record_audit_log(
        db=db, module="LOOMS", action="DELETE",
        description=f"Deleted loom '{number}'",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=loom_id, record_title=number
    )

    db.delete(l)
    db.commit()

    return {"message": f"Loom '{number}' deleted successfully", "success": True}

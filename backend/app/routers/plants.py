from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.plant import Plant
from app.models.user import User, UserPlant
from app.auth.dependencies import get_current_user
from app.services.audit_service import record_audit_log
from app.schemas.plant import PlantCreate, PlantUpdate
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/plants", tags=["Plant / Unit Access"])

def serialize_plant(plant: Plant) -> dict:
    return {
        "id": plant.id,
        "code": plant.code,
        "name": plant.name,
        "location": plant.location,
        "manager_name": plant.manager_name,
        "contact_phone": plant.contact_phone,
        "email": plant.email,
        "status": plant.status,
        "active_looms": len([l for l in plant.looms if l.status == "RUNNING"]) if plant.looms else 0,
        "assigned_users_count": len(plant.user_plants) if plant.user_plants else 0,
        "created_at": plant.created_at
    }

@router.get("")
def list_plants(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Plant)
    if status and status != "ALL":
        query = query.filter(Plant.status == status.upper())
    plants = query.order_by(Plant.name.asc()).all()
    return [serialize_plant(p) for p in plants]

@router.post("", status_code=status.HTTP_201_CREATED)
def create_plant(
    body: PlantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Plant).filter(Plant.code.ilike(body.code.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail="Plant unit code already exists")

    plant = Plant(
        code=body.code.strip().upper(),
        name=body.name.strip(),
        location=body.location.strip(),
        manager_name=body.manager_name,
        contact_phone=body.contact_phone,
        email=body.email,
        status=body.status or "ACTIVE"
    )
    db.add(plant)
    db.commit()
    db.refresh(plant)

    record_audit_log(
        db=db,
        module="PLANTS",
        action="CREATE",
        description=f"Registered new manufacturing unit '{plant.name}' ({plant.code})",
        user_name=current_user.full_name,
        user_id=current_user.id,
        record_id=plant.id,
        record_title=plant.name
    )

    return serialize_plant(plant)

@router.put("/{plant_id}")
def update_plant(
    plant_id: str,
    body: PlantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    if body.code is not None:
        plant.code = body.code.strip().upper()
    if body.name is not None:
        plant.name = body.name.strip()
    if body.location is not None:
        plant.location = body.location.strip()
    if body.manager_name is not None:
        plant.manager_name = body.manager_name
    if body.contact_phone is not None:
        plant.contact_phone = body.contact_phone
    if body.email is not None:
        plant.email = body.email
    if body.status is not None:
        plant.status = body.status

    db.commit()
    db.refresh(plant)

    record_audit_log(
        db=db,
        module="PLANTS",
        action="UPDATE",
        description=f"Updated details for plant '{plant.name}' ({plant.code})",
        user_name=current_user.full_name,
        user_id=current_user.id,
        record_id=plant.id,
        record_title=plant.name
    )

    return serialize_plant(plant)

@router.delete("/{plant_id}", response_model=MessageResponse)
def delete_plant(
    plant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    name = plant.name

    # Clear references in warehouses, looms, departments, user_plants, user_approvals
    from app.models.master_data import Warehouse, Loom
    from app.models.department import Department
    from app.models.user import UserPlant
    from app.models.audit import UserApproval

    db.query(Warehouse).filter(Warehouse.plant_id == plant.id).update({"plant_id": None})
    db.query(Loom).filter(Loom.plant_id == plant.id).update({"plant_id": None})
    db.query(Department).filter(Department.plant_id == plant.id).update({"plant_id": None})
    db.query(UserPlant).filter(UserPlant.plant_id == plant.id).delete()
    db.query(UserApproval).filter(UserApproval.requested_plant_id == plant.id).update({"requested_plant_id": None})

    record_audit_log(
        db=db,
        module="PLANTS",
        action="DELETE",
        description=f"Deleted manufacturing plant '{name}'",
        user_name=current_user.full_name,
        user_id=current_user.id,
        record_id=plant_id,
        record_title=name
    )

    db.delete(plant)
    db.commit()

    return {"message": f"Plant '{name}' has been deleted successfully", "success": True}

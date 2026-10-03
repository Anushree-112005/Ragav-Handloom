from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.master_data import Warehouse
from app.models.plant import Plant
from app.models.user import User
from app.auth.dependencies import get_current_user, require_department_access
from app.services.audit_service import record_audit_log
from app.schemas.master_data import WarehouseCreate, WarehouseUpdate, WarehouseResponse
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/warehouses", tags=["Warehouse Master"])

WHSE_ROLES = ["SUPER_ADMIN", "INV_MANAGER"]

def serialize_warehouse(w: Warehouse) -> dict:
    return {
        "id": w.id,
        "code": w.code,
        "name": w.name,
        "plant_id": w.plant_id,
        "plant_name": w.plant.name if w.plant else None,
        "location": w.location,
        "warehouse_type": w.warehouse_type,
        "capacity_sqft": w.capacity_sqft,
        "manager_name": w.manager_name,
        "contact_phone": w.contact_phone,
        "status": w.status,
        "created_at": w.created_at
    }

@router.get("")
def list_warehouses(
    search: Optional[str] = None,
    warehouse_type: Optional[str] = None,
    plant_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Warehouse)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Warehouse.name.ilike(s)) | (Warehouse.code.ilike(s)) | (Warehouse.location.ilike(s)))
    if warehouse_type and warehouse_type != "ALL":
        query = query.filter(Warehouse.warehouse_type == warehouse_type)
    if plant_id:
        query = query.filter(Warehouse.plant_id == plant_id)
    if status and status != "ALL":
        query = query.filter(Warehouse.status == status.upper())
    warehouses = query.order_by(Warehouse.name.asc()).all()
    return [serialize_warehouse(w) for w in warehouses]

@router.post("", status_code=status.HTTP_201_CREATED)
def create_warehouse(
    body: WarehouseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_department_access(WHSE_ROLES, "Inventory"))
):
    if db.query(Warehouse).filter(Warehouse.code.ilike(body.code.strip())).first():
        raise HTTPException(status_code=400, detail="Warehouse code already exists")
    w = Warehouse(
        code=body.code.strip().upper(),
        name=body.name.strip(),
        plant_id=body.plant_id,
        location=body.location.strip(),
        warehouse_type=body.warehouse_type,
        capacity_sqft=body.capacity_sqft or 5000,
        manager_name=body.manager_name,
        contact_phone=body.contact_phone,
        status=body.status or "ACTIVE"
    )
    db.add(w)
    db.commit()
    db.refresh(w)
    record_audit_log(
        db=db, module="WAREHOUSES", action="CREATE",
        description=f"Created warehouse '{w.name}' ({w.code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=w.id, record_title=w.name
    )
    return serialize_warehouse(w)

@router.put("/{warehouse_id}")
def update_warehouse(
    warehouse_id: str,
    body: WarehouseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_department_access(WHSE_ROLES, "Inventory"))
):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    if body.code:
        w.code = body.code.strip().upper()
    if body.name:
        w.name = body.name.strip()
    if body.plant_id is not None:
        w.plant_id = body.plant_id
    if body.location:
        w.location = body.location.strip()
    if body.warehouse_type:
        w.warehouse_type = body.warehouse_type
    if body.capacity_sqft is not None:
        w.capacity_sqft = body.capacity_sqft
    if body.manager_name is not None:
        w.manager_name = body.manager_name
    if body.contact_phone is not None:
        w.contact_phone = body.contact_phone
    if body.status:
        w.status = body.status
    db.commit()
    db.refresh(w)
    record_audit_log(
        db=db, module="WAREHOUSES", action="UPDATE",
        description=f"Updated warehouse '{w.name}' ({w.code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=w.id, record_title=w.name
    )
    return serialize_warehouse(w)

@router.delete("/{warehouse_id}", response_model=MessageResponse)
def delete_warehouse(
    warehouse_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_department_access(WHSE_ROLES, "Inventory"))
):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    name = w.name

    # Clear references in inventory items
    from app.models.operations import InventoryItem
    db.query(InventoryItem).filter(InventoryItem.warehouse_id == w.id).update({"warehouse_id": None})

    record_audit_log(
        db=db, module="WAREHOUSES", action="DELETE",
        description=f"Deleted warehouse '{name}'",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=warehouse_id, record_title=name
    )

    db.delete(w)
    db.commit()

    return {"message": f"Warehouse '{name}' deleted successfully", "success": True}

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.master_data import Fabric
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.services.audit_service import record_audit_log
from app.schemas.master_data import FabricCreate, FabricUpdate
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/fabrics", tags=["Fabric Master"])

def serialize_fabric(f: Fabric) -> dict:
    return {
        "id": f.id,
        "code": f.code,
        "name": f.name,
        "fabric_type": f.fabric_type,
        "composition": f.composition,
        "gsm": f.gsm,
        "width_inches": f.width_inches,
        "uom_id": f.uom_id,
        "uom_name": f.uom.name if f.uom else None,
        "colour_id": f.colour_id,
        "colour_name": f.colour.name if f.colour else None,
        "colour_hex": f.colour.hex_code if f.colour else None,
        "supplier_id": f.supplier_id,
        "supplier_name": f.supplier.name if f.supplier else None,
        "description": f.description,
        "status": f.status,
        "image_url": f.image_url,
        "created_at": f.created_at
    }

@router.get("")
def list_fabrics(
    search: Optional[str] = None,
    fabric_type: Optional[str] = None,
    supplier_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Fabric)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Fabric.name.ilike(s),
                Fabric.code.ilike(s),
                Fabric.composition.ilike(s),
                Fabric.fabric_type.ilike(s)
            )
        )
    if fabric_type and fabric_type != "ALL":
        query = query.filter(Fabric.fabric_type == fabric_type)
    if supplier_id:
        query = query.filter(Fabric.supplier_id == supplier_id)
    if status and status != "ALL":
        query = query.filter(Fabric.status == status.upper())
    fabrics = query.order_by(Fabric.name.asc()).all()
    return [serialize_fabric(f) for f in fabrics]

@router.post("", status_code=status.HTTP_201_CREATED)
def create_fabric(
    body: FabricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if db.query(Fabric).filter(Fabric.code.ilike(body.code.strip())).first():
        raise HTTPException(status_code=400, detail="Fabric code already exists")
    f = Fabric(
        code=body.code.strip().upper(),
        name=body.name.strip(),
        fabric_type=body.fabric_type,
        composition=body.composition.strip(),
        gsm=body.gsm,
        width_inches=body.width_inches,
        uom_id=body.uom_id,
        colour_id=body.colour_id,
        supplier_id=body.supplier_id,
        description=body.description,
        status=body.status or "ACTIVE",
        image_url=body.image_url
    )
    db.add(f)
    db.commit()
    db.refresh(f)
    record_audit_log(
        db=db, module="FABRICS", action="CREATE",
        description=f"Created fabric '{f.name}' ({f.code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=f.id, record_title=f.name
    )
    return serialize_fabric(f)

@router.put("/{fabric_id}")
def update_fabric(
    fabric_id: str,
    body: FabricUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    f = db.query(Fabric).filter(Fabric.id == fabric_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Fabric not found")
    if body.code:
        f.code = body.code.strip().upper()
    if body.name:
        f.name = body.name.strip()
    if body.fabric_type:
        f.fabric_type = body.fabric_type
    if body.composition:
        f.composition = body.composition.strip()
    if body.gsm is not None:
        f.gsm = body.gsm
    if body.width_inches is not None:
        f.width_inches = body.width_inches
    if body.uom_id is not None:
        f.uom_id = body.uom_id
    if body.colour_id is not None:
        f.colour_id = body.colour_id
    if body.supplier_id is not None:
        f.supplier_id = body.supplier_id
    if body.description is not None:
        f.description = body.description
    if body.status:
        f.status = body.status
    if body.image_url is not None:
        f.image_url = body.image_url

    db.commit()
    db.refresh(f)
    record_audit_log(
        db=db, module="FABRICS", action="UPDATE",
        description=f"Updated fabric '{f.name}' ({f.code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=f.id, record_title=f.name
    )
    return serialize_fabric(f)

@router.delete("/{fabric_id}", response_model=MessageResponse)
def delete_fabric(
    fabric_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    f = db.query(Fabric).filter(Fabric.id == fabric_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Fabric not found")
    name = f.name

    # Clear references in products
    from app.models.master_data import Product
    db.query(Product).filter(Product.fabric_id == f.id).update({"fabric_id": None})

    record_audit_log(
        db=db, module="FABRICS", action="DELETE",
        description=f"Deleted fabric '{name}'",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=fabric_id, record_title=name
    )

    db.delete(f)
    db.commit()

    return {"message": f"Fabric '{name}' deleted successfully", "success": True}

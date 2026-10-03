from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.master_data import UOM
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.services.audit_service import record_audit_log
from app.schemas.master_data import UOMCreate, UOMUpdate, UOMResponse
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/uom", tags=["UOM Master"])

@router.get("", response_model=list[UOMResponse])
def list_uom(
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(UOM)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((UOM.name.ilike(s)) | (UOM.code.ilike(s)))
    if status and status != "ALL":
        query = query.filter(UOM.status == status.upper())
    return query.order_by(UOM.code.asc()).all()

@router.post("", response_model=UOMResponse, status_code=status.HTTP_201_CREATED)
def create_uom(
    body: UOMCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if db.query(UOM).filter(UOM.code.ilike(body.code.strip())).first():
        raise HTTPException(status_code=400, detail="UOM code already exists")
    u = UOM(
        code=body.code.strip().upper(),
        name=body.name.strip(),
        description=body.description,
        status=body.status or "ACTIVE"
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    record_audit_log(
        db=db, module="UOM", action="CREATE",
        description=f"Created UOM '{u.name}' ({u.code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=u.id, record_title=u.name
    )
    return u

@router.put("/{uom_id}", response_model=UOMResponse)
def update_uom(
    uom_id: str,
    body: UOMUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    u = db.query(UOM).filter(UOM.id == uom_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="UOM not found")
    if body.code:
        u.code = body.code.strip().upper()
    if body.name:
        u.name = body.name.strip()
    if body.description is not None:
        u.description = body.description
    if body.status:
        u.status = body.status
    db.commit()
    db.refresh(u)
    record_audit_log(
        db=db, module="UOM", action="UPDATE",
        description=f"Updated UOM '{u.name}' ({u.code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=u.id, record_title=u.name
    )
    return u

@router.delete("/{uom_id}", response_model=MessageResponse)
def delete_uom(
    uom_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    u = db.query(UOM).filter(UOM.id == uom_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="UOM not found")
    name = u.name

    # Clear references in fabrics, yarns, and products
    from app.models.master_data import Fabric, Yarn, Product
    db.query(Fabric).filter(Fabric.uom_id == u.id).update({"uom_id": None})
    db.query(Yarn).filter(Yarn.uom_id == u.id).update({"uom_id": None})
    db.query(Product).filter(Product.uom_id == u.id).update({"uom_id": None})

    record_audit_log(
        db=db, module="UOM", action="DELETE",
        description=f"Deleted UOM '{name}'",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=uom_id, record_title=name
    )

    db.delete(u)
    db.commit()

    return {"message": f"UOM '{name}' deleted successfully", "success": True}

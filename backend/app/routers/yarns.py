from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.master_data import Yarn
from app.models.user import User
from app.auth.dependencies import get_current_user, require_department_access
from app.services.audit_service import record_audit_log
from app.schemas.master_data import YarnCreate, YarnUpdate
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/yarns", tags=["Yarn Master"])

YARN_ROLES = ["SUPER_ADMIN", "INV_MANAGER", "PURCH_MANAGER"]

def serialize_yarn(y: Yarn) -> dict:
    return {
        "id": y.id,
        "code": y.code,
        "name": y.name,
        "yarn_type": y.yarn_type,
        "count": y.count,
        "composition": y.composition,
        "colour_id": y.colour_id,
        "colour_name": y.colour.name if y.colour else None,
        "colour_hex": y.colour.hex_code if y.colour else None,
        "uom_id": y.uom_id,
        "uom_name": y.uom.name if y.uom else None,
        "supplier_id": y.supplier_id,
        "supplier_name": y.supplier.name if y.supplier else None,
        "stock_status": y.stock_status,
        "status": y.status,
        "created_at": y.created_at
    }

@router.get("")
def list_yarns(
    search: Optional[str] = None,
    yarn_type: Optional[str] = None,
    stock_status: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Yarn)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Yarn.name.ilike(s),
                Yarn.code.ilike(s),
                Yarn.yarn_type.ilike(s),
                Yarn.count.ilike(s)
            )
        )
    if yarn_type and yarn_type != "ALL":
        query = query.filter(Yarn.yarn_type == yarn_type)
    if stock_status and stock_status != "ALL":
        query = query.filter(Yarn.stock_status == stock_status)
    if status and status != "ALL":
        query = query.filter(Yarn.status == status.upper())
    yarns = query.order_by(Yarn.name.asc()).all()
    return [serialize_yarn(y) for y in yarns]

@router.post("", status_code=status.HTTP_201_CREATED)
def create_yarn(
    body: YarnCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_department_access(YARN_ROLES, "Inventory"))
):
    if db.query(Yarn).filter(Yarn.code.ilike(body.code.strip())).first():
        raise HTTPException(status_code=400, detail="Yarn code already exists")
    y = Yarn(
        code=body.code.strip().upper(),
        name=body.name.strip(),
        yarn_type=body.yarn_type,
        count=body.count.strip(),
        composition=body.composition.strip(),
        colour_id=body.colour_id,
        uom_id=body.uom_id,
        supplier_id=body.supplier_id,
        stock_status=body.stock_status or "AVAILABLE",
        status=body.status or "ACTIVE"
    )
    db.add(y)
    db.commit()
    db.refresh(y)
    record_audit_log(
        db=db, module="YARNS", action="CREATE",
        description=f"Created yarn '{y.name}' ({y.code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=y.id, record_title=y.name
    )
    return serialize_yarn(y)

@router.put("/{yarn_id}")
def update_yarn(
    yarn_id: str,
    body: YarnUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_department_access(YARN_ROLES, "Inventory"))
):
    y = db.query(Yarn).filter(Yarn.id == yarn_id).first()
    if not y:
        raise HTTPException(status_code=404, detail="Yarn not found")
    if body.code:
        y.code = body.code.strip().upper()
    if body.name:
        y.name = body.name.strip()
    if body.yarn_type:
        y.yarn_type = body.yarn_type
    if body.count:
        y.count = body.count.strip()
    if body.composition:
        y.composition = body.composition.strip()
    if body.colour_id is not None:
        y.colour_id = body.colour_id
    if body.uom_id is not None:
        y.uom_id = body.uom_id
    if body.supplier_id is not None:
        y.supplier_id = body.supplier_id
    if body.stock_status:
        y.stock_status = body.stock_status
    if body.status:
        y.status = body.status

    db.commit()
    db.refresh(y)
    record_audit_log(
        db=db, module="YARNS", action="UPDATE",
        description=f"Updated yarn '{y.name}' ({y.code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=y.id, record_title=y.name
    )
    return serialize_yarn(y)

@router.delete("/{yarn_id}", response_model=MessageResponse)
def delete_yarn(
    yarn_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_department_access(YARN_ROLES, "Inventory"))
):
    y = db.query(Yarn).filter(Yarn.id == yarn_id).first()
    if not y:
        raise HTTPException(status_code=404, detail="Yarn not found")
    name = y.name

    record_audit_log(
        db=db, module="YARNS", action="DELETE",
        description=f"Deleted yarn '{name}'",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=yarn_id, record_title=name
    )

    db.delete(y)
    db.commit()

    return {"message": f"Yarn '{name}' deleted successfully", "success": True}

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.master_data import Design
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.services.audit_service import record_audit_log
from app.schemas.master_data import DesignCreate, DesignUpdate, DesignResponse
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/designs", tags=["Design & Pattern Master"])

@router.get("", response_model=list[DesignResponse])
def list_designs(
    search: Optional[str] = None,
    pattern_type: Optional[str] = None,
    collection: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Design)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Design.name.ilike(s)) | (Design.code.ilike(s)) | (Design.motif.ilike(s)))
    if pattern_type and pattern_type != "ALL":
        query = query.filter(Design.pattern_type == pattern_type)
    if collection and collection != "ALL":
        query = query.filter(Design.collection == collection)
    if status and status != "ALL":
        query = query.filter(Design.status == status.upper())
    return query.order_by(Design.name.asc()).all()

@router.post("", response_model=DesignResponse, status_code=status.HTTP_201_CREATED)
def create_design(
    body: DesignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if db.query(Design).filter(Design.code.ilike(body.code.strip())).first():
        raise HTTPException(status_code=400, detail="Design code already exists")
    d = Design(
        code=body.code.strip().upper(),
        name=body.name.strip(),
        pattern_type=body.pattern_type,
        motif=body.motif,
        collection=body.collection,
        description=body.description,
        reference_image_url=body.reference_image_url,
        status=body.status or "ACTIVE"
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    record_audit_log(
        db=db, module="DESIGNS", action="CREATE",
        description=f"Created design '{d.name}' ({d.code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=d.id, record_title=d.name
    )
    return d

@router.put("/{design_id}", response_model=DesignResponse)
def update_design(
    design_id: str,
    body: DesignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    d = db.query(Design).filter(Design.id == design_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Design not found")
    if body.code:
        d.code = body.code.strip().upper()
    if body.name:
        d.name = body.name.strip()
    if body.pattern_type is not None:
        d.pattern_type = body.pattern_type
    if body.motif is not None:
        d.motif = body.motif
    if body.collection is not None:
        d.collection = body.collection
    if body.description is not None:
        d.description = body.description
    if body.reference_image_url is not None:
        d.reference_image_url = body.reference_image_url
    if body.status:
        d.status = body.status
    db.commit()
    db.refresh(d)
    record_audit_log(
        db=db, module="DESIGNS", action="UPDATE",
        description=f"Updated design '{d.name}' ({d.code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=d.id, record_title=d.name
    )
    return d

@router.delete("/{design_id}", response_model=MessageResponse)
def delete_design(
    design_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    d = db.query(Design).filter(Design.id == design_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Design not found")
    name = d.name

    # Clear references in products
    from app.models.master_data import Product
    db.query(Product).filter(Product.design_id == d.id).update({"design_id": None})

    record_audit_log(
        db=db, module="DESIGNS", action="DELETE",
        description=f"Deleted design '{name}'",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=design_id, record_title=name
    )

    db.delete(d)
    db.commit()

    return {"message": f"Design '{name}' deleted successfully", "success": True}

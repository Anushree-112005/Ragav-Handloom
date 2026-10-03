from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.master_data import Colour
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.services.audit_service import record_audit_log
from app.schemas.master_data import ColourCreate, ColourUpdate, ColourResponse
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/colours", tags=["Colour Master"])

@router.get("", response_model=list[ColourResponse])
def list_colours(
    search: Optional[str] = None,
    dye_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Colour)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Colour.name.ilike(s)) | (Colour.code.ilike(s)) | (Colour.colour_family.ilike(s)))
    if dye_type and dye_type != "ALL":
        query = query.filter(Colour.dye_type == dye_type)
    if status and status != "ALL":
        query = query.filter(Colour.status == status.upper())
    return query.order_by(Colour.name.asc()).all()

@router.post("", response_model=ColourResponse, status_code=status.HTTP_201_CREATED)
def create_colour(
    body: ColourCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if db.query(Colour).filter(Colour.code.ilike(body.code.strip())).first():
        raise HTTPException(status_code=400, detail="Colour code already exists")
    c = Colour(
        code=body.code.strip().upper(),
        name=body.name.strip(),
        colour_family=body.colour_family,
        hex_code=body.hex_code.strip(),
        dye_type=body.dye_type,
        description=body.description,
        status=body.status or "ACTIVE"
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    record_audit_log(
        db=db, module="COLOURS", action="CREATE",
        description=f"Created colour '{c.name}' ({c.hex_code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=c.id, record_title=c.name
    )
    return c

@router.put("/{colour_id}", response_model=ColourResponse)
def update_colour(
    colour_id: str,
    body: ColourUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(Colour).filter(Colour.id == colour_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Colour not found")
    if body.code:
        c.code = body.code.strip().upper()
    if body.name:
        c.name = body.name.strip()
    if body.colour_family is not None:
        c.colour_family = body.colour_family
    if body.hex_code:
        c.hex_code = body.hex_code.strip()
    if body.dye_type is not None:
        c.dye_type = body.dye_type
    if body.description is not None:
        c.description = body.description
    if body.status:
        c.status = body.status
    db.commit()
    db.refresh(c)
    record_audit_log(
        db=db, module="COLOURS", action="UPDATE",
        description=f"Updated colour '{c.name}' ({c.hex_code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=c.id, record_title=c.name
    )
    return c

@router.delete("/{colour_id}", response_model=MessageResponse)
def delete_colour(
    colour_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(Colour).filter(Colour.id == colour_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Colour not found")
    name = c.name

    # Clear references in fabrics, yarns, products
    from app.models.master_data import Fabric, Yarn, Product
    db.query(Fabric).filter(Fabric.colour_id == c.id).update({"colour_id": None})
    db.query(Yarn).filter(Yarn.colour_id == c.id).update({"colour_id": None})
    db.query(Product).filter(Product.colour_id == c.id).update({"colour_id": None})

    record_audit_log(
        db=db, module="COLOURS", action="DELETE",
        description=f"Deleted colour '{name}'",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=colour_id, record_title=name
    )

    db.delete(c)
    db.commit()

    return {"message": f"Colour '{name}' deleted successfully", "success": True}

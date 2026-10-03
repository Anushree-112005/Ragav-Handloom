from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.master_data import Supplier
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.services.audit_service import record_audit_log
from app.schemas.master_data import SupplierCreate, SupplierUpdate, SupplierResponse
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/suppliers", tags=["Supplier Master"])

@router.get("", response_model=list[SupplierResponse])
def list_suppliers(
    search: Optional[str] = None,
    city: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Supplier)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Supplier.name.ilike(s)) |
            (Supplier.supplier_code.ilike(s)) |
            (Supplier.contact_person.ilike(s)) |
            (Supplier.materials_supplied.ilike(s))
        )
    if city and city != "ALL":
        query = query.filter(Supplier.city.ilike(f"%{city}%"))
    if status and status != "ALL":
        query = query.filter(Supplier.status == status.upper())
    return query.order_by(Supplier.name.asc()).all()

@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    body: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if db.query(Supplier).filter(Supplier.supplier_code.ilike(body.supplier_code.strip())).first():
        raise HTTPException(status_code=400, detail="Supplier code already exists")
    s = Supplier(
        supplier_code=body.supplier_code.strip().upper(),
        name=body.name.strip(),
        contact_person=body.contact_person,
        email=body.email,
        phone=body.phone,
        address=body.address,
        city=body.city,
        state=body.state,
        gst_number=body.gst_number,
        materials_supplied=body.materials_supplied,
        payment_terms=body.payment_terms,
        status=body.status or "ACTIVE"
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    record_audit_log(
        db=db, module="SUPPLIERS", action="CREATE",
        description=f"Created supplier '{s.name}' ({s.supplier_code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=s.id, record_title=s.name
    )
    return s

@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: str,
    body: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    if body.supplier_code:
        s.supplier_code = body.supplier_code.strip().upper()
    if body.name:
        s.name = body.name.strip()
    if body.contact_person is not None:
        s.contact_person = body.contact_person
    if body.email is not None:
        s.email = body.email
    if body.phone is not None:
        s.phone = body.phone
    if body.address is not None:
        s.address = body.address
    if body.city is not None:
        s.city = body.city
    if body.state is not None:
        s.state = body.state
    if body.gst_number is not None:
        s.gst_number = body.gst_number
    if body.materials_supplied is not None:
        s.materials_supplied = body.materials_supplied
    if body.payment_terms is not None:
        s.payment_terms = body.payment_terms
    if body.status:
        s.status = body.status
    db.commit()
    db.refresh(s)
    record_audit_log(
        db=db, module="SUPPLIERS", action="UPDATE",
        description=f"Updated supplier '{s.name}' ({s.supplier_code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=s.id, record_title=s.name
    )
    return s

@router.delete("/{supplier_id}", response_model=MessageResponse)
def delete_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    name = s.name

    # Clear references in fabrics, yarns, and purchase orders
    from app.models.master_data import Fabric, Yarn
    from app.models.operations import PurchaseOrder
    db.query(Fabric).filter(Fabric.supplier_id == s.id).update({"supplier_id": None})
    db.query(Yarn).filter(Yarn.supplier_id == s.id).update({"supplier_id": None})
    db.query(PurchaseOrder).filter(PurchaseOrder.supplier_id == s.id).update({"supplier_id": None})

    record_audit_log(
        db=db, module="SUPPLIERS", action="DELETE",
        description=f"Deleted supplier '{name}'",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=supplier_id, record_title=name
    )

    db.delete(s)
    db.commit()

    return {"message": f"Supplier '{name}' deleted successfully", "success": True}

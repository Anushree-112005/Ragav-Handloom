from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.master_data import Customer
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.services.audit_service import record_audit_log
from app.schemas.master_data import CustomerCreate, CustomerUpdate, CustomerResponse
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/customers", tags=["Customer Master"])

@router.get("", response_model=list[CustomerResponse])
def list_customers(
    search: Optional[str] = None,
    customer_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Customer)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Customer.name.ilike(s)) |
            (Customer.customer_code.ilike(s)) |
            (Customer.contact_person.ilike(s)) |
            (Customer.city.ilike(s))
        )
    if customer_type and customer_type != "ALL":
        query = query.filter(Customer.customer_type == customer_type)
    if status and status != "ALL":
        query = query.filter(Customer.status == status.upper())
    return query.order_by(Customer.name.asc()).all()

@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    body: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if db.query(Customer).filter(Customer.customer_code.ilike(body.customer_code.strip())).first():
        raise HTTPException(status_code=400, detail="Customer code already exists")
    c = Customer(
        customer_code=body.customer_code.strip().upper(),
        name=body.name.strip(),
        customer_type=body.customer_type,
        contact_person=body.contact_person,
        email=body.email,
        phone=body.phone,
        address=body.address,
        city=body.city,
        state=body.state,
        gst_number=body.gst_number,
        credit_limit=body.credit_limit or 0.0,
        payment_terms=body.payment_terms,
        status=body.status or "ACTIVE"
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    record_audit_log(
        db=db, module="CUSTOMERS", action="CREATE",
        description=f"Created customer '{c.name}' ({c.customer_code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=c.id, record_title=c.name
    )
    return c

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: str,
    body: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    if body.customer_code:
        c.customer_code = body.customer_code.strip().upper()
    if body.name:
        c.name = body.name.strip()
    if body.customer_type is not None:
        c.customer_type = body.customer_type
    if body.contact_person is not None:
        c.contact_person = body.contact_person
    if body.email is not None:
        c.email = body.email
    if body.phone is not None:
        c.phone = body.phone
    if body.address is not None:
        c.address = body.address
    if body.city is not None:
        c.city = body.city
    if body.state is not None:
        c.state = body.state
    if body.gst_number is not None:
        c.gst_number = body.gst_number
    if body.credit_limit is not None:
        c.credit_limit = body.credit_limit
    if body.payment_terms is not None:
        c.payment_terms = body.payment_terms
    if body.status:
        c.status = body.status
    db.commit()
    db.refresh(c)
    record_audit_log(
        db=db, module="CUSTOMERS", action="UPDATE",
        description=f"Updated customer '{c.name}' ({c.customer_code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=c.id, record_title=c.name
    )
    return c

@router.delete("/{customer_id}", response_model=MessageResponse)
def delete_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    name = c.name

    # Clear references in sales orders
    from app.models.operations import SalesOrder
    db.query(SalesOrder).filter(SalesOrder.customer_id == c.id).update({"customer_id": None})

    record_audit_log(
        db=db, module="CUSTOMERS", action="DELETE",
        description=f"Deleted customer '{name}'",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=customer_id, record_title=name
    )

    db.delete(c)
    db.commit()

    return {"message": f"Customer '{name}' deleted successfully", "success": True}

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.master_data import Product
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.services.audit_service import record_audit_log
from app.schemas.master_data import ProductCreate, ProductUpdate
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/products", tags=["Product Master"])

def serialize_product(p: Product) -> dict:
    return {
        "id": p.id,
        "code": p.code,
        "name": p.name,
        "category": p.category,
        "product_type": p.product_type,
        "fabric_id": p.fabric_id,
        "fabric_name": p.fabric.name if p.fabric else None,
        "design_id": p.design_id,
        "design_name": p.design.name if p.design else None,
        "colour_id": p.colour_id,
        "colour_name": p.colour.name if p.colour else None,
        "colour_hex": p.colour.hex_code if p.colour else None,
        "size": p.size,
        "uom_id": p.uom_id,
        "uom_name": p.uom.name if p.uom else None,
        "cost_price": p.cost_price,
        "selling_price": p.selling_price,
        "description": p.description,
        "status": p.status,
        "image_url": p.image_url,
        "created_at": p.created_at
    }

@router.get("")
def list_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Product)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(s),
                Product.code.ilike(s),
                Product.category.ilike(s)
            )
        )
    if category and category != "ALL":
        query = query.filter(Product.category == category)
    if status and status != "ALL":
        query = query.filter(Product.status == status.upper())
    products = query.order_by(Product.name.asc()).all()
    return [serialize_product(p) for p in products]

@router.post("", status_code=status.HTTP_201_CREATED)
def create_product(
    body: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if db.query(Product).filter(Product.code.ilike(body.code.strip())).first():
        raise HTTPException(status_code=400, detail="Product code already exists")
    p = Product(
        code=body.code.strip().upper(),
        name=body.name.strip(),
        category=body.category,
        product_type=body.product_type,
        fabric_id=body.fabric_id,
        design_id=body.design_id,
        colour_id=body.colour_id,
        size=body.size,
        uom_id=body.uom_id,
        cost_price=body.cost_price,
        selling_price=body.selling_price,
        description=body.description,
        status=body.status or "ACTIVE",
        image_url=body.image_url
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    record_audit_log(
        db=db, module="PRODUCTS", action="CREATE",
        description=f"Created product '{p.name}' ({p.code}) in category {p.category}",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=p.id, record_title=p.name
    )
    return serialize_product(p)

@router.put("/{product_id}")
def update_product(
    product_id: str,
    body: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    if body.code:
        p.code = body.code.strip().upper()
    if body.name:
        p.name = body.name.strip()
    if body.category:
        p.category = body.category
    if body.product_type is not None:
        p.product_type = body.product_type
    if body.fabric_id is not None:
        p.fabric_id = body.fabric_id
    if body.design_id is not None:
        p.design_id = body.design_id
    if body.colour_id is not None:
        p.colour_id = body.colour_id
    if body.size is not None:
        p.size = body.size
    if body.uom_id is not None:
        p.uom_id = body.uom_id
    if body.cost_price is not None:
        p.cost_price = body.cost_price
    if body.selling_price is not None:
        p.selling_price = body.selling_price
    if body.description is not None:
        p.description = body.description
    if body.status:
        p.status = body.status
    if body.image_url is not None:
        p.image_url = body.image_url

    db.commit()
    db.refresh(p)
    record_audit_log(
        db=db, module="PRODUCTS", action="UPDATE",
        description=f"Updated product '{p.name}' ({p.code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=p.id, record_title=p.name
    )
    return serialize_product(p)

@router.delete("/{product_id}", response_model=MessageResponse)
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    name = p.name

    # Clear references in production orders
    from app.models.operations import ProductionOrder
    db.query(ProductionOrder).filter(ProductionOrder.product_id == p.id).update({"product_id": None})

    record_audit_log(
        db=db, module="PRODUCTS", action="DELETE",
        description=f"Deleted product '{name}'",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=product_id, record_title=name
    )

    db.delete(p)
    db.commit()

    return {"message": f"Product '{name}' deleted successfully", "success": True}

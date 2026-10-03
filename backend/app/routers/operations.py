from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.operations import (
    ProductionOrder, InventoryItem, PurchaseOrder, SalesOrder, QualityInspection
)
from app.models.user import User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/operations", tags=["Operations"])

@router.get("/production")
def get_production_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    orders = db.query(ProductionOrder).order_by(ProductionOrder.created_at.desc()).limit(20).all()
    return [
        {
            "id": o.id,
            "order_number": o.order_number,
            "product_name": o.product.name if o.product else "Silk Saree",
            "loom_number": o.loom.loom_number if o.loom else "L-101",
            "artisan_name": o.artisan.name if o.artisan else "Master Weaver",
            "target_quantity": o.target_quantity,
            "completed_quantity": o.completed_quantity,
            "start_date": o.start_date,
            "target_end_date": o.target_end_date,
            "status": o.status,
            "notes": o.notes,
            "created_at": o.created_at
        }
        for o in orders
    ]

@router.get("/inventory")
def get_inventory_items(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(InventoryItem).order_by(InventoryItem.created_at.desc()).limit(20).all()
    return [
        {
            "id": i.id,
            "item_code": i.item_code,
            "item_name": i.item_name,
            "category": i.category,
            "warehouse_name": i.warehouse.name if i.warehouse else "Main Depot",
            "quantity_on_hand": i.quantity_on_hand,
            "min_reorder_level": i.min_reorder_level,
            "unit_of_measure": i.unit_of_measure,
            "batch_number": i.batch_number,
            "status": i.status,
            "created_at": i.created_at
        }
        for i in items
    ]

@router.get("/purchase")
def get_purchase_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pos = db.query(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).limit(20).all()
    return [
        {
            "id": p.id,
            "po_number": p.po_number,
            "supplier_name": p.supplier.name if p.supplier else "Yarn Supplier",
            "total_amount": p.total_amount,
            "order_date": p.order_date,
            "expected_delivery_date": p.expected_delivery_date,
            "status": p.status,
            "created_at": p.created_at
        }
        for p in pos
    ]

@router.get("/sales")
def get_sales_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sos = db.query(SalesOrder).order_by(SalesOrder.created_at.desc()).limit(20).all()
    return [
        {
            "id": s.id,
            "so_number": s.so_number,
            "customer_name": s.customer.name if s.customer else "Heritage Boutique",
            "total_amount": s.total_amount,
            "order_date": s.order_date,
            "dispatch_date": s.dispatch_date,
            "status": s.status,
            "created_at": s.created_at
        }
        for s in sos
    ]

@router.get("/quality")
def get_quality_inspections(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inspections = db.query(QualityInspection).order_by(QualityInspection.created_at.desc()).limit(20).all()
    return [
        {
            "id": q.id,
            "inspection_number": q.inspection_number,
            "product_name": q.product.name if q.product else "Woven Fabric",
            "inspector_name": q.inspector_name,
            "fabric_grade": q.fabric_grade,
            "defects_found": q.defects_found,
            "inspection_date": q.inspection_date,
            "status": q.status,
            "created_at": q.created_at
        }
        for q in inspections
    ]

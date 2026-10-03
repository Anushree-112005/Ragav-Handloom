from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class ProductionOrderResponse(BaseModel):
    id: str
    order_number: str
    product_name: Optional[str] = None
    loom_number: Optional[str] = None
    artisan_name: Optional[str] = None
    target_quantity: int
    completed_quantity: int
    start_date: Optional[str] = None
    target_end_date: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class InventoryItemResponse(BaseModel):
    id: str
    item_code: str
    item_name: str
    category: str
    warehouse_name: Optional[str] = None
    quantity_on_hand: float
    min_reorder_level: float
    unit_of_measure: str
    batch_number: Optional[str] = None
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class PurchaseOrderResponse(BaseModel):
    id: str
    po_number: str
    supplier_name: Optional[str] = None
    total_amount: float
    order_date: str
    expected_delivery_date: Optional[str] = None
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class SalesOrderResponse(BaseModel):
    id: str
    so_number: str
    customer_name: Optional[str] = None
    total_amount: float
    order_date: str
    dispatch_date: Optional[str] = None
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class QualityInspectionResponse(BaseModel):
    id: str
    inspection_number: str
    product_name: Optional[str] = None
    inspector_name: str
    fabric_grade: str
    defects_found: Optional[str] = None
    inspection_date: str
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

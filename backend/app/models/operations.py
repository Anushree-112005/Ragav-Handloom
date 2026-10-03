from sqlalchemy import Column, String, Float, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimeStampedMixin

class ProductionOrder(Base, TimeStampedMixin):
    __tablename__ = "production_orders"

    order_number = Column(String(50), unique=True, nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    loom_id = Column(String(36), ForeignKey("looms.id", ondelete="SET NULL"), nullable=True)
    artisan_id = Column(String(36), ForeignKey("artisans.id", ondelete="SET NULL"), nullable=True)
    target_quantity = Column(Integer, nullable=False)
    completed_quantity = Column(Integer, default=0, nullable=False)
    start_date = Column(String(50), nullable=True)
    target_end_date = Column(String(50), nullable=True)
    status = Column(String(30), default="IN_PROGRESS", nullable=False)  # PLANNED, IN_PROGRESS, COMPLETED, ON_HOLD
    notes = Column(Text, nullable=True)

    # Relationships
    product = relationship("Product")
    loom = relationship("Loom")
    artisan = relationship("Artisan")

class InventoryItem(Base, TimeStampedMixin):
    __tablename__ = "inventory_items"

    item_code = Column(String(50), unique=True, nullable=False, index=True)
    item_name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)  # RAW_MATERIAL, FINISHED_GOODS, WIP, CONSUMABLES
    warehouse_id = Column(String(36), ForeignKey("warehouses.id", ondelete="SET NULL"), nullable=True)
    quantity_on_hand = Column(Float, default=0.0, nullable=False)
    min_reorder_level = Column(Float, default=10.0, nullable=False)
    unit_of_measure = Column(String(20), default="Meters", nullable=False)
    batch_number = Column(String(50), nullable=True)
    status = Column(String(20), default="AVAILABLE", nullable=False)

    # Relationships
    warehouse = relationship("Warehouse")

class PurchaseOrder(Base, TimeStampedMixin):
    __tablename__ = "purchase_orders"

    po_number = Column(String(50), unique=True, nullable=False, index=True)
    supplier_id = Column(String(36), ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    total_amount = Column(Float, default=0.0, nullable=False)
    order_date = Column(String(50), nullable=False)
    expected_delivery_date = Column(String(50), nullable=True)
    status = Column(String(30), default="PENDING_RECEIPT", nullable=False)  # DRAFT, PENDING_RECEIPT, RECEIVED, CANCELLED

    # Relationships
    supplier = relationship("Supplier")

class SalesOrder(Base, TimeStampedMixin):
    __tablename__ = "sales_orders"

    so_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    total_amount = Column(Float, default=0.0, nullable=False)
    order_date = Column(String(50), nullable=False)
    dispatch_date = Column(String(50), nullable=True)
    status = Column(String(30), default="PROCESSING", nullable=False)  # DRAFT, PROCESSING, DISPATCHED, DELIVERED

    # Relationships
    customer = relationship("Customer")

class QualityInspection(Base, TimeStampedMixin):
    __tablename__ = "quality_inspections"

    inspection_number = Column(String(50), unique=True, nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    inspector_name = Column(String(100), nullable=False)
    fabric_grade = Column(String(20), default="A_GRADE", nullable=False)  # A_GRADE, B_GRADE, REJECTED
    defects_found = Column(Text, nullable=True)
    inspection_date = Column(String(50), nullable=False)
    status = Column(String(20), default="PASSED", nullable=False)  # PASSED, FAILED, UNDER_REVIEW

    # Relationships
    product = relationship("Product")

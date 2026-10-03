from sqlalchemy import Column, String, Float, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimeStampedMixin

class UOM(Base, TimeStampedMixin):
    __tablename__ = "uom"

    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)

class TaxRate(Base, TimeStampedMixin):
    __tablename__ = "tax_rates"

    tax_code = Column(String(50), unique=True, nullable=False, index=True)
    tax_name = Column(String(100), nullable=False)
    gst_percentage = Column(Float, nullable=False)
    hsn_code = Column(String(50), nullable=False)
    tax_category = Column(String(100), nullable=True)
    effective_from = Column(String(50), nullable=True)
    effective_to = Column(String(50), nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)

class Colour(Base, TimeStampedMixin):
    __tablename__ = "colours"

    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    colour_family = Column(String(100), nullable=True)
    hex_code = Column(String(10), nullable=False)
    dye_type = Column(String(100), nullable=True)  # Natural Vegetable, Vat Dye, Reactive Dye, Azo-free
    description = Column(String(255), nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)

class Design(Base, TimeStampedMixin):
    __tablename__ = "designs"

    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    pattern_type = Column(String(100), nullable=True)
    motif = Column(String(150), nullable=True)
    collection = Column(String(150), nullable=True)
    description = Column(Text, nullable=True)
    reference_image_url = Column(String(500), nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)

class Supplier(Base, TimeStampedMixin):
    __tablename__ = "suppliers"

    supplier_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    contact_person = Column(String(150), nullable=True)
    email = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    gst_number = Column(String(50), nullable=True)
    materials_supplied = Column(String(255), nullable=True)
    payment_terms = Column(String(100), nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)

    # Relationships
    fabrics = relationship("Fabric", back_populates="supplier")
    yarns = relationship("Yarn", back_populates="supplier")

class Customer(Base, TimeStampedMixin):
    __tablename__ = "customers"

    customer_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    customer_type = Column(String(100), nullable=True)  # Retail Chain, Boutique, Wholesaler, Exporter
    contact_person = Column(String(150), nullable=True)
    email = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    gst_number = Column(String(50), nullable=True)
    credit_limit = Column(Float, default=0.0, nullable=True)
    payment_terms = Column(String(100), nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)

class Warehouse(Base, TimeStampedMixin):
    __tablename__ = "warehouses"

    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    plant_id = Column(String(36), ForeignKey("plants.id", ondelete="SET NULL"), nullable=True)
    location = Column(String(200), nullable=False)
    warehouse_type = Column(String(100), nullable=False)  # Raw Material, Finished Goods, WIP, General Storage
    capacity_sqft = Column(Integer, default=5000, nullable=True)
    manager_name = Column(String(100), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)

    # Relationships
    plant = relationship("Plant", back_populates="warehouses")

class Fabric(Base, TimeStampedMixin):
    __tablename__ = "fabrics"

    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    fabric_type = Column(String(100), nullable=False)  # Silk, Cotton, Khadi, Linen, Blend
    composition = Column(String(150), nullable=False)  # 100% Mulberry Silk, 60% Cotton 40% Silk, etc.
    gsm = Column(Integer, nullable=True)
    width_inches = Column(Float, nullable=True)
    uom_id = Column(String(36), ForeignKey("uom.id", ondelete="SET NULL"), nullable=True)
    colour_id = Column(String(36), ForeignKey("colours.id", ondelete="SET NULL"), nullable=True)
    supplier_id = Column(String(36), ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)
    image_url = Column(String(500), nullable=True)

    # Relationships
    uom = relationship("UOM")
    colour = relationship("Colour")
    supplier = relationship("Supplier", back_populates="fabrics")
    products = relationship("Product", back_populates="fabric")

class Yarn(Base, TimeStampedMixin):
    __tablename__ = "yarns"

    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    yarn_type = Column(String(100), nullable=False)  # Cotton, Mulberry Silk, Linen, Viscose
    count = Column(String(50), nullable=False)       # 60s Ne, 2/120s, 20s Slub, etc.
    composition = Column(String(150), nullable=False)
    colour_id = Column(String(36), ForeignKey("colours.id", ondelete="SET NULL"), nullable=True)
    uom_id = Column(String(36), ForeignKey("uom.id", ondelete="SET NULL"), nullable=True)
    supplier_id = Column(String(36), ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    stock_status = Column(String(30), default="IN_STOCK", nullable=False)  # IN_STOCK, LOW_STOCK, OUT_OF_STOCK
    status = Column(String(20), default="ACTIVE", nullable=False)

    # Relationships
    colour = relationship("Colour")
    uom = relationship("UOM")
    supplier = relationship("Supplier", back_populates="yarns")

class Product(Base, TimeStampedMixin):
    __tablename__ = "products"

    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)  # Sarees, Dupattas, Fabrics, Stoles, Home Linen
    product_type = Column(String(100), nullable=True)
    fabric_id = Column(String(36), ForeignKey("fabrics.id", ondelete="SET NULL"), nullable=True)
    design_id = Column(String(36), ForeignKey("designs.id", ondelete="SET NULL"), nullable=True)
    colour_id = Column(String(36), ForeignKey("colours.id", ondelete="SET NULL"), nullable=True)
    size = Column(String(50), nullable=True)        # 6.25m, 2.5m, Free Size, Standard
    uom_id = Column(String(36), ForeignKey("uom.id", ondelete="SET NULL"), nullable=True)
    cost_price = Column(Float, default=0.0, nullable=False)
    selling_price = Column(Float, default=0.0, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)
    image_url = Column(String(500), nullable=True)

    # Relationships
    fabric = relationship("Fabric", back_populates="products")
    design = relationship("Design")
    colour = relationship("Colour")
    uom = relationship("UOM")

class Artisan(Base, TimeStampedMixin):
    __tablename__ = "artisans"

    artisan_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    location = Column(String(150), nullable=False)
    skill_level = Column(String(50), default="MASTER_WEAVER", nullable=False)  # MASTER_WEAVER, SENIOR_ARTISAN, APPRENTICE
    specialization = Column(String(150), nullable=False)  # Cotton Weaving, Silk Weaving, Jacquard, Motifs, Dyeing
    experience_years = Column(Integer, default=5, nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    joining_date = Column(String(50), nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)
    profile_image_url = Column(String(500), nullable=True)

    # Relationships
    department = relationship("Department", back_populates="artisans")
    looms = relationship("Loom", back_populates="assigned_artisan")

class Loom(Base, TimeStampedMixin):
    __tablename__ = "looms"

    loom_number = Column(String(50), unique=True, nullable=False, index=True)
    loom_type = Column(String(100), nullable=False)  # PIT_LOOM, FRAME_LOOM, JACQUARD, RAISED_LOOM
    plant_id = Column(String(36), ForeignKey("plants.id", ondelete="SET NULL"), nullable=True)
    location = Column(String(150), nullable=True)
    capacity_meters_per_day = Column(Float, default=5.0, nullable=False)
    width_inches = Column(Float, default=48.0, nullable=False)
    assigned_artisan_id = Column(String(36), ForeignKey("artisans.id", ondelete="SET NULL"), nullable=True)
    installation_date = Column(String(50), nullable=True)
    last_maintenance_date = Column(String(50), nullable=True)
    status = Column(String(20), default="RUNNING", nullable=False)  # RUNNING, IDLE, MAINTENANCE, INACTIVE

    # Relationships
    plant = relationship("Plant", back_populates="looms")
    assigned_artisan = relationship("Artisan", back_populates="looms")

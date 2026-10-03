from typing import Optional
from datetime import datetime
from pydantic import BaseModel

# --- UOM ---
class UOMBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    status: Optional[str] = "ACTIVE"

class UOMCreate(UOMBase):
    pass

class UOMUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class UOMResponse(UOMBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

# --- Tax Rate ---
class TaxRateBase(BaseModel):
    tax_code: str
    tax_name: str
    gst_percentage: float
    hsn_code: str
    tax_category: Optional[str] = None
    effective_from: Optional[str] = None
    effective_to: Optional[str] = None
    status: Optional[str] = "ACTIVE"

class TaxRateCreate(TaxRateBase):
    pass

class TaxRateUpdate(BaseModel):
    tax_code: Optional[str] = None
    tax_name: Optional[str] = None
    gst_percentage: Optional[float] = None
    hsn_code: Optional[str] = None
    tax_category: Optional[str] = None
    effective_from: Optional[str] = None
    effective_to: Optional[str] = None
    status: Optional[str] = None

class TaxRateResponse(TaxRateBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

# --- Colour ---
class ColourBase(BaseModel):
    code: str
    name: str
    colour_family: Optional[str] = None
    hex_code: str
    dye_type: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "ACTIVE"

class ColourCreate(ColourBase):
    pass

class ColourUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    colour_family: Optional[str] = None
    hex_code: Optional[str] = None
    dye_type: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class ColourResponse(ColourBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

# --- Design ---
class DesignBase(BaseModel):
    code: str
    name: str
    pattern_type: Optional[str] = None
    motif: Optional[str] = None
    collection: Optional[str] = None
    description: Optional[str] = None
    reference_image_url: Optional[str] = None
    status: Optional[str] = "ACTIVE"

class DesignCreate(DesignBase):
    pass

class DesignUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    pattern_type: Optional[str] = None
    motif: Optional[str] = None
    collection: Optional[str] = None
    description: Optional[str] = None
    reference_image_url: Optional[str] = None
    status: Optional[str] = None

class DesignResponse(DesignBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

# --- Supplier ---
class SupplierBase(BaseModel):
    supplier_code: str
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None
    materials_supplied: Optional[str] = None
    payment_terms: Optional[str] = None
    status: Optional[str] = "ACTIVE"

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    supplier_code: Optional[str] = None
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None
    materials_supplied: Optional[str] = None
    payment_terms: Optional[str] = None
    status: Optional[str] = None

class SupplierResponse(SupplierBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

# --- Customer ---
class CustomerBase(BaseModel):
    customer_code: str
    name: str
    customer_type: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None
    credit_limit: Optional[float] = 0.0
    payment_terms: Optional[str] = None
    status: Optional[str] = "ACTIVE"

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    customer_code: Optional[str] = None
    name: Optional[str] = None
    customer_type: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None
    credit_limit: Optional[float] = None
    payment_terms: Optional[str] = None
    status: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

# --- Warehouse ---
class WarehouseBase(BaseModel):
    code: str
    name: str
    plant_id: Optional[str] = None
    location: str
    warehouse_type: str
    capacity_sqft: Optional[int] = 5000
    manager_name: Optional[str] = None
    contact_phone: Optional[str] = None
    status: Optional[str] = "ACTIVE"

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    plant_id: Optional[str] = None
    location: Optional[str] = None
    warehouse_type: Optional[str] = None
    capacity_sqft: Optional[int] = None
    manager_name: Optional[str] = None
    contact_phone: Optional[str] = None
    status: Optional[str] = None

class WarehouseResponse(WarehouseBase):
    id: str
    created_at: datetime
    plant_name: Optional[str] = None
    class Config:
        from_attributes = True

# --- Fabric ---
class FabricBase(BaseModel):
    code: str
    name: str
    fabric_type: str
    composition: str
    gsm: Optional[int] = None
    width_inches: Optional[float] = None
    uom_id: Optional[str] = None
    colour_id: Optional[str] = None
    supplier_id: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    image_url: Optional[str] = None

class FabricCreate(FabricBase):
    pass

class FabricUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    fabric_type: Optional[str] = None
    composition: Optional[str] = None
    gsm: Optional[int] = None
    width_inches: Optional[float] = None
    uom_id: Optional[str] = None
    colour_id: Optional[str] = None
    supplier_id: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    image_url: Optional[str] = None

class FabricResponse(FabricBase):
    id: str
    created_at: datetime
    uom_name: Optional[str] = None
    colour_name: Optional[str] = None
    colour_hex: Optional[str] = None
    supplier_name: Optional[str] = None
    class Config:
        from_attributes = True

# --- Yarn ---
class YarnBase(BaseModel):
    code: str
    name: str
    yarn_type: str
    count: str
    composition: str
    colour_id: Optional[str] = None
    uom_id: Optional[str] = None
    supplier_id: Optional[str] = None
    stock_status: Optional[str] = "IN_STOCK"
    status: Optional[str] = "ACTIVE"

class YarnCreate(YarnBase):
    pass

class YarnUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    yarn_type: Optional[str] = None
    count: Optional[str] = None
    composition: Optional[str] = None
    colour_id: Optional[str] = None
    uom_id: Optional[str] = None
    supplier_id: Optional[str] = None
    stock_status: Optional[str] = None
    status: Optional[str] = None

class YarnResponse(YarnBase):
    id: str
    created_at: datetime
    colour_name: Optional[str] = None
    colour_hex: Optional[str] = None
    uom_name: Optional[str] = None
    supplier_name: Optional[str] = None
    class Config:
        from_attributes = True

# --- Product ---
class ProductBase(BaseModel):
    code: str
    name: str
    category: str
    product_type: Optional[str] = None
    fabric_id: Optional[str] = None
    design_id: Optional[str] = None
    colour_id: Optional[str] = None
    size: Optional[str] = None
    uom_id: Optional[str] = None
    cost_price: float = 0.0
    selling_price: float = 0.0
    description: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    product_type: Optional[str] = None
    fabric_id: Optional[str] = None
    design_id: Optional[str] = None
    colour_id: Optional[str] = None
    size: Optional[str] = None
    uom_id: Optional[str] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    description: Optional[str] = None
    status: Optional[str] = None
    image_url: Optional[str] = None

class ProductResponse(ProductBase):
    id: str
    created_at: datetime
    fabric_name: Optional[str] = None
    design_name: Optional[str] = None
    colour_name: Optional[str] = None
    colour_hex: Optional[str] = None
    uom_name: Optional[str] = None
    class Config:
        from_attributes = True

# --- Artisan ---
class ArtisanBase(BaseModel):
    artisan_code: str
    name: str
    phone: Optional[str] = None
    location: str
    skill_level: str = "MASTER_WEAVER"
    specialization: str
    experience_years: int = 5
    department_id: Optional[str] = None
    joining_date: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    profile_image_url: Optional[str] = None

class ArtisanCreate(ArtisanBase):
    pass

class ArtisanUpdate(BaseModel):
    artisan_code: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    skill_level: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    department_id: Optional[str] = None
    joining_date: Optional[str] = None
    status: Optional[str] = None
    profile_image_url: Optional[str] = None

class ArtisanResponse(ArtisanBase):
    id: str
    created_at: datetime
    department_name: Optional[str] = None
    assigned_loom_number: Optional[str] = None
    class Config:
        from_attributes = True

# --- Loom ---
class LoomBase(BaseModel):
    loom_number: str
    loom_type: str
    plant_id: Optional[str] = None
    location: Optional[str] = None
    capacity_meters_per_day: float = 5.0
    width_inches: float = 48.0
    assigned_artisan_id: Optional[str] = None
    installation_date: Optional[str] = None
    last_maintenance_date: Optional[str] = None
    status: Optional[str] = "RUNNING"

class LoomCreate(LoomBase):
    pass

class LoomUpdate(BaseModel):
    loom_number: Optional[str] = None
    loom_type: Optional[str] = None
    plant_id: Optional[str] = None
    location: Optional[str] = None
    capacity_meters_per_day: Optional[float] = None
    width_inches: Optional[float] = None
    assigned_artisan_id: Optional[str] = None
    installation_date: Optional[str] = None
    last_maintenance_date: Optional[str] = None
    status: Optional[str] = None

class LoomResponse(LoomBase):
    id: str
    created_at: datetime
    plant_name: Optional[str] = None
    artisan_name: Optional[str] = None
    class Config:
        from_attributes = True

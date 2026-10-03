from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class PlantBase(BaseModel):
    code: str
    name: str
    location: str
    manager_name: Optional[str] = None
    contact_phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = "ACTIVE"

class PlantCreate(PlantBase):
    pass

class PlantUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    location: Optional[str] = None
    manager_name: Optional[str] = None
    contact_phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None

class PlantResponse(PlantBase):
    id: str
    created_at: datetime
    active_looms: Optional[int] = 0
    assigned_users_count: Optional[int] = 0

    class Config:
        from_attributes = True

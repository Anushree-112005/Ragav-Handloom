from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class DepartmentBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    department_head: Optional[str] = None
    plant_id: Optional[str] = None
    status: Optional[str] = "ACTIVE"

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    department_head: Optional[str] = None
    plant_id: Optional[str] = None
    status: Optional[str] = None

class DepartmentResponse(DepartmentBase):
    id: str
    created_at: datetime
    plant_name: Optional[str] = None
    user_count: Optional[int] = 0

    class Config:
        from_attributes = True

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class PermissionSchema(BaseModel):
    id: Optional[str] = None
    module: str
    can_view: bool = False
    can_create: bool = False
    can_edit: bool = False
    can_delete: bool = False
    can_approve: bool = False
    can_export: bool = False

    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    is_system: Optional[bool] = False

class RoleCreate(RoleBase):
    permissions: Optional[List[PermissionSchema]] = []

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[PermissionSchema]] = None

class RoleResponse(RoleBase):
    id: str
    created_at: datetime
    permissions: List[PermissionSchema] = []

    class Config:
        from_attributes = True

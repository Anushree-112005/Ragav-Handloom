from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr

class UserPlantItem(BaseModel):
    plant_id: str
    is_primary: bool = False
    plant_name: Optional[str] = None

class UserBase(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    department_id: Optional[str] = None
    role_id: str
    designation: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str
    plant_ids: Optional[List[str]] = []

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department_id: Optional[str] = None
    role_id: Optional[str] = None
    designation: Optional[str] = None
    status: Optional[str] = None
    avatar_url: Optional[str] = None
    plant_ids: Optional[List[str]] = None

class UserStatusUpdate(BaseModel):
    status: str  # ACTIVE, INACTIVE

class ResetPasswordRequest(BaseModel):
    new_password: str

class UserResponse(UserBase):
    id: str
    full_name: str
    role_name: Optional[str] = None
    department_name: Optional[str] = None
    plants: List[UserPlantItem] = []
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserDetailResponse(UserResponse):
    permissions: List[dict] = []
    recent_activity: List[dict] = []
    login_history: List[dict] = []

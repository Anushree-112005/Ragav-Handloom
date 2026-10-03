from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: str
    module: str
    action: str
    record_id: Optional[str] = None
    record_title: Optional[str] = None
    description: str
    ip_address: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class LoginActivityResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    email: str
    ip_address: str
    device: str
    browser: str
    status: str
    failure_reason: Optional[str] = None
    login_time: datetime
    logout_time: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserApprovalResponse(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    department_name: Optional[str] = None
    requested_role_name: Optional[str] = None
    requested_plant_name: Optional[str] = None
    requested_by: str
    status: str
    decision_notes: Optional[str] = None
    decided_by: Optional[str] = None
    decided_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApprovalDecisionRequest(BaseModel):
    action: str  # APPROVE, REJECT
    notes: Optional[str] = None

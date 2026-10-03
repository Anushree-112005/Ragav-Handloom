from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog, LoginActivity

def record_audit_log(
    db: Session,
    module: str,
    action: str,
    description: str,
    user_name: str = "System Admin",
    user_id: Optional[str] = None,
    record_id: Optional[str] = None,
    record_title: Optional[str] = None,
    ip_address: str = "127.0.0.1",
    status: str = "SUCCESS"
) -> AuditLog:
    """Record an action in the system audit trail."""
    log = AuditLog(
        user_id=user_id,
        user_name=user_name,
        module=module.upper(),
        action=action.upper(),
        record_id=str(record_id) if record_id else None,
        record_title=record_title,
        description=description,
        ip_address=ip_address,
        status=status
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def record_login_activity(
    db: Session,
    email: str,
    user_id: Optional[str] = None,
    ip_address: str = "127.0.0.1",
    device: str = "Desktop",
    browser: str = "Chrome",
    status: str = "SUCCESS",
    failure_reason: Optional[str] = None
) -> LoginActivity:
    """Record a login attempt in the login activity table."""
    activity = LoginActivity(
        user_id=user_id,
        email=email,
        ip_address=ip_address,
        device=device,
        browser=browser,
        status=status,
        failure_reason=failure_reason
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity

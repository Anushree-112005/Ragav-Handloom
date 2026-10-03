import math
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.audit import AuditLog
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.schemas.audit import AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("")
def list_audit_logs(
    search: Optional[str] = None,
    module: Optional[str] = None,
    action: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AuditLog)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                AuditLog.description.ilike(s),
                AuditLog.user_name.ilike(s),
                AuditLog.record_title.ilike(s),
                AuditLog.module.ilike(s),
                AuditLog.action.ilike(s)
            )
        )

    if module and module != "ALL":
        query = query.filter(AuditLog.module == module.upper())

    if action and action != "ALL":
        query = query.filter(AuditLog.action == action.upper())

    total = query.count()
    records = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return {
        "items": records,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

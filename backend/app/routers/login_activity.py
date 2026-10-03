import math
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.audit import LoginActivity
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.schemas.audit import LoginActivityResponse

router = APIRouter(prefix="/login-activity", tags=["Login Activity"])

@router.get("")
def list_login_activity(
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(LoginActivity)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                LoginActivity.email.ilike(s),
                LoginActivity.ip_address.ilike(s),
                LoginActivity.device.ilike(s),
                LoginActivity.browser.ilike(s)
            )
        )

    if status and status != "ALL":
        query = query.filter(LoginActivity.status == status.upper())

    total = query.count()
    records = query.order_by(LoginActivity.login_time.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return {
        "items": records,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

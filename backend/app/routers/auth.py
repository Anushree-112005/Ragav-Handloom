from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.audit import LoginActivity
from app.auth.security import verify_password, get_password_hash
from app.auth.jwt import create_access_token
from app.auth.dependencies import get_current_user
from app.services.audit_service import record_audit_log, record_login_activity
from app.schemas.auth import LoginRequest, TokenResponse, PasswordChangeRequest
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    raw_email = body.email.strip().lower()
    password = body.password

    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent", "Browser")

    # Support friendly aliases and shortcut usernames
    aliases = {
        "superadmin": "admin@loomora.com",
        "superadmin@loomora.com": "admin@loomora.com",
        "super_admin": "admin@loomora.com",
        "admin": "admin@loomora.com",
        "production": "production@loomora.com",
        "weaver": "weaver@loomora.com",
        "inventory": "inventory@loomora.com",
        "quality": "quality@loomora.com",
        "hr": "hr@loomora.com",
    }
    email = aliases.get(raw_email, raw_email)
    if "@" not in email:
        email = f"{email}@loomora.com"

    user = db.query(User).filter(User.email.ilike(email)).first()
    if not user or not verify_password(password, user.password_hash):
        record_login_activity(
            db=db,
            email=email,
            user_id=user.id if user else None,
            ip_address=client_ip,
            browser=user_agent[:50],
            status="FAILED",
            failure_reason="Invalid credentials"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if user.status != "ACTIVE":
        record_login_activity(
            db=db,
            email=email,
            user_id=user.id,
            ip_address=client_ip,
            browser=user_agent[:50],
            status="FAILED",
            failure_reason=f"Account status: {user.status}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {user.status.lower()}. Please contact administrator."
        )

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    record_login_activity(
        db=db,
        email=user.email,
        user_id=user.id,
        ip_address=client_ip,
        browser=user_agent[:50],
        status="SUCCESS"
    )

    record_audit_log(
        db=db,
        module="AUTH",
        action="LOGIN",
        description=f"User {user.full_name} logged in successfully",
        user_name=user.full_name,
        user_id=user.id,
        ip_address=client_ip
    )

    access_token = create_access_token(data={"sub": user.email, "id": user.id})

    user_data = {
        "id": user.id,
        "employee_id": user.employee_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role.name if user.role else "Super Administrator",
        "role_code": user.role.code if user.role else "SUPER_ADMIN",
        "department": user.department.name if user.department else "Executive",
        "avatar_url": user.avatar_url,
        "status": user.status
    }

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data
    }

@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    user_plants = [
        {"id": up.plant.id, "name": up.plant.name, "code": up.plant.code, "is_primary": up.is_primary}
        for up in current_user.plants if up.plant
    ]
    return {
        "id": current_user.id,
        "employee_id": current_user.employee_id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role.name if current_user.role else "Super Administrator",
        "role_code": current_user.role.code if current_user.role else "SUPER_ADMIN",
        "department": current_user.department.name if current_user.department else "Executive",
        "designation": current_user.designation,
        "plants": user_plants,
        "avatar_url": current_user.avatar_url,
        "status": current_user.status,
        "last_login": current_user.last_login
    }

@router.post("/change-password", response_model=MessageResponse)
def change_password(
    body: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password does not match")
    if body.new_password != body.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    current_user.password_hash = get_password_hash(body.new_password)
    db.commit()

    record_audit_log(
        db=db,
        module="AUTH",
        action="CHANGE_PASSWORD",
        description=f"User {current_user.full_name} changed their password",
        user_name=current_user.full_name,
        user_id=current_user.id
    )

    return {"message": "Password updated successfully", "success": True}

@router.post("/logout", response_model=MessageResponse)
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record_audit_log(
        db=db,
        module="AUTH",
        action="LOGOUT",
        description=f"User {current_user.full_name} logged out",
        user_name=current_user.full_name,
        user_id=current_user.id
    )
    return {"message": "Logged out successfully", "success": True}

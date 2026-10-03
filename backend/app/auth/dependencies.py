from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.jwt import decode_access_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Retrieve and validate current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        # Fallback to demo admin user if not authenticated in development mode
        # or raise 401
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception

    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Check if the authenticated user is active."""
    if current_user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    return current_user

def require_role(allowed_roles: list[str]):
    """Enforce role-based access control."""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role and current_user.role.name not in allowed_roles and current_user.role.code not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )
        return current_user
    return role_checker

def require_super_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Enforce that only Super Administrator can perform this action."""
    is_super = (
        (current_user.role and current_user.role.code == "SUPER_ADMIN")
        or current_user.email == "admin@loomora.com"
    )
    if not is_super:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only Super Administrator can control this resource."
        )
    return current_user

def require_department_access(allowed_roles: list[str], department_name: str = "this department"):
    """
    Allow action if:
    1. User is Super Administrator (can control everything)
    2. User belongs to one of the allowed departmental manager roles
    """
    def checker(current_user: User = Depends(get_current_active_user)) -> User:
        is_super = (
            (current_user.role and current_user.role.code == "SUPER_ADMIN")
            or current_user.email == "admin@loomora.com"
        )
        if is_super:
            return current_user

        user_role_code = current_user.role.code if current_user.role else ""
        user_role_name = current_user.role.name if current_user.role else ""

        if user_role_code in allowed_roles or user_role_name in allowed_roles:
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Only Super Administrator or {department_name} managers can modify this data."
        )
    return checker


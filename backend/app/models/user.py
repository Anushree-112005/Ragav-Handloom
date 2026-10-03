from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimeStampedMixin

class User(Base, TimeStampedMixin):
    __tablename__ = "users"

    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=False)
    
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    role_id = Column(String(36), ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    designation = Column(String(100), nullable=True)
    
    status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE, INACTIVE, PENDING_APPROVAL
    avatar_url = Column(String(500), nullable=True)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    role = relationship("Role", back_populates="users")
    department = relationship("Department", back_populates="users")
    plants = relationship("UserPlant", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    login_activities = relationship("LoginActivity", back_populates="user")
    approval_requests = relationship("UserApproval", back_populates="user", foreign_keys="UserApproval.user_id")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

class UserPlant(Base, TimeStampedMixin):
    __tablename__ = "user_plants"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plant_id = Column(String(36), ForeignKey("plants.id", ondelete="CASCADE"), nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="plants")
    plant = relationship("Plant", back_populates="user_plants")

from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimeStampedMixin

class AuditLog(Base, TimeStampedMixin):
    __tablename__ = "audit_logs"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_name = Column(String(150), nullable=False)
    module = Column(String(50), nullable=False, index=True)  # USERS, ROLES, PRODUCTS, FABRICS, etc.
    action = Column(String(50), nullable=False, index=True)  # CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN
    record_id = Column(String(50), nullable=True)
    record_title = Column(String(200), nullable=True)
    description = Column(Text, nullable=False)
    ip_address = Column(String(50), default="127.0.0.1", nullable=True)
    status = Column(String(20), default="SUCCESS", nullable=False)  # SUCCESS, FAILED

    # Relationships
    user = relationship("User", back_populates="audit_logs")

class LoginActivity(Base, TimeStampedMixin):
    __tablename__ = "login_activity"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    email = Column(String(150), nullable=False, index=True)
    ip_address = Column(String(50), default="127.0.0.1", nullable=False)
    device = Column(String(100), default="Desktop", nullable=False)
    browser = Column(String(100), default="Chrome", nullable=False)
    status = Column(String(20), default="SUCCESS", nullable=False)  # SUCCESS, FAILED
    failure_reason = Column(String(255), nullable=True)
    login_time = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    logout_time = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="login_activities")

class UserApproval(Base, TimeStampedMixin):
    __tablename__ = "user_approvals"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    requested_role_id = Column(String(36), ForeignKey("roles.id", ondelete="SET NULL"), nullable=True)
    requested_plant_id = Column(String(36), ForeignKey("plants.id", ondelete="SET NULL"), nullable=True)
    requested_by = Column(String(150), nullable=False)
    status = Column(String(20), default="PENDING", nullable=False, index=True)  # PENDING, APPROVED, REJECTED
    decision_notes = Column(Text, nullable=True)
    decided_by = Column(String(150), nullable=True)
    decided_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="approval_requests")
    requested_role = relationship("Role")
    requested_plant = relationship("Plant")

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimeStampedMixin

class Department(Base, TimeStampedMixin):
    __tablename__ = "departments"

    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(String(255), nullable=True)
    department_head = Column(String(100), nullable=True)
    plant_id = Column(String(36), ForeignKey("plants.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE, INACTIVE

    # Relationships
    plant = relationship("Plant", back_populates="departments")
    users = relationship("User", back_populates="department")
    artisans = relationship("Artisan", back_populates="department")

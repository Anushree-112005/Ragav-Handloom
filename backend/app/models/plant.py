from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimeStampedMixin

class Plant(Base, TimeStampedMixin):
    __tablename__ = "plants"

    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    location = Column(String(200), nullable=False)
    manager_name = Column(String(100), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE, INACTIVE

    # Relationships
    departments = relationship("Department", back_populates="plant")
    user_plants = relationship("UserPlant", back_populates="plant", cascade="all, delete-orphan")
    warehouses = relationship("Warehouse", back_populates="plant")
    looms = relationship("Loom", back_populates="plant")

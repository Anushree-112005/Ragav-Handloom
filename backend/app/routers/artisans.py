from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.master_data import Artisan
from app.models.user import User
from app.auth.dependencies import get_current_user, require_department_access
from app.services.audit_service import record_audit_log
from app.schemas.master_data import ArtisanCreate, ArtisanUpdate
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/artisans", tags=["Weaver / Artisan Master"])

ARTISAN_ROLES = ["SUPER_ADMIN", "PROD_MANAGER", "HR_MANAGER"]

def serialize_artisan(a: Artisan) -> dict:
    assigned_loom = a.looms[0].loom_number if a.looms else None
    return {
        "id": a.id,
        "artisan_code": a.artisan_code,
        "name": a.name,
        "phone": a.phone,
        "location": a.location,
        "skill_level": a.skill_level,
        "specialization": a.specialization,
        "experience_years": a.experience_years,
        "department_id": a.department_id,
        "department_name": a.department.name if a.department else None,
        "assigned_loom_number": assigned_loom,
        "joining_date": a.joining_date,
        "status": a.status,
        "profile_image_url": a.profile_image_url,
        "created_at": a.created_at
    }

@router.get("")
def list_artisans(
    search: Optional[str] = None,
    specialization: Optional[str] = None,
    skill_level: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Artisan)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Artisan.name.ilike(s),
                Artisan.artisan_code.ilike(s),
                Artisan.location.ilike(s),
                Artisan.specialization.ilike(s)
            )
        )
    if specialization and specialization != "ALL":
        query = query.filter(Artisan.specialization.ilike(f"%{specialization}%"))
    if skill_level and skill_level != "ALL":
        query = query.filter(Artisan.skill_level == skill_level)
    if status and status != "ALL":
        query = query.filter(Artisan.status == status.upper())
    artisans = query.order_by(Artisan.name.asc()).all()
    return [serialize_artisan(a) for a in artisans]

@router.post("", status_code=status.HTTP_201_CREATED)
def create_artisan(
    body: ArtisanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_department_access(ARTISAN_ROLES, "Production / HR"))
):
    if db.query(Artisan).filter(Artisan.artisan_code.ilike(body.artisan_code.strip())).first():
        raise HTTPException(status_code=400, detail="Artisan code already exists")
    a = Artisan(
        artisan_code=body.artisan_code.strip().upper(),
        name=body.name.strip(),
        phone=body.phone,
        location=body.location.strip(),
        skill_level=body.skill_level,
        specialization=body.specialization.strip(),
        experience_years=body.experience_years,
        department_id=body.department_id,
        joining_date=body.joining_date,
        status=body.status or "ACTIVE",
        profile_image_url=body.profile_image_url
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    record_audit_log(
        db=db, module="ARTISANS", action="CREATE",
        description=f"Registered artisan '{a.name}' ({a.artisan_code}), specialization: {a.specialization}",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=a.id, record_title=a.name
    )
    return serialize_artisan(a)

@router.put("/{artisan_id}")
def update_artisan(
    artisan_id: str,
    body: ArtisanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_department_access(ARTISAN_ROLES, "Production / HR"))
):
    a = db.query(Artisan).filter(Artisan.id == artisan_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Artisan not found")
    if body.artisan_code:
        a.artisan_code = body.artisan_code.strip().upper()
    if body.name:
        a.name = body.name.strip()
    if body.phone is not None:
        a.phone = body.phone
    if body.location:
        a.location = body.location.strip()
    if body.skill_level:
        a.skill_level = body.skill_level
    if body.specialization:
        a.specialization = body.specialization.strip()
    if body.experience_years is not None:
        a.experience_years = body.experience_years
    if body.department_id is not None:
        a.department_id = body.department_id
    if body.joining_date is not None:
        a.joining_date = body.joining_date
    if body.status:
        a.status = body.status
    if body.profile_image_url is not None:
        a.profile_image_url = body.profile_image_url

    db.commit()
    db.refresh(a)
    record_audit_log(
        db=db, module="ARTISANS", action="UPDATE",
        description=f"Updated profile for artisan '{a.name}' ({a.artisan_code})",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=a.id, record_title=a.name
    )
    return serialize_artisan(a)

@router.delete("/{artisan_id}", response_model=MessageResponse)
def delete_artisan(
    artisan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_department_access(ARTISAN_ROLES, "Production / HR"))
):
    a = db.query(Artisan).filter(Artisan.id == artisan_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Artisan not found")
    name = a.name

    # Clear references in looms and production orders
    from app.models.master_data import Loom
    from app.models.operations import ProductionOrder
    db.query(Loom).filter(Loom.assigned_artisan_id == a.id).update({"assigned_artisan_id": None})
    db.query(ProductionOrder).filter(ProductionOrder.artisan_id == a.id).update({"artisan_id": None})

    record_audit_log(
        db=db, module="ARTISANS", action="DELETE",
        description=f"Deleted artisan '{name}'",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=artisan_id, record_title=name
    )

    db.delete(a)
    db.commit()

    return {"message": f"Artisan '{name}' deleted successfully", "success": True}

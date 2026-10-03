from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.master_data import TaxRate
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.services.audit_service import record_audit_log
from app.schemas.master_data import TaxRateCreate, TaxRateUpdate, TaxRateResponse
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/tax-rates", tags=["Tax / GST Master"])

@router.get("", response_model=list[TaxRateResponse])
def list_tax_rates(
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(TaxRate)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (TaxRate.tax_name.ilike(s)) |
            (TaxRate.tax_code.ilike(s)) |
            (TaxRate.hsn_code.ilike(s))
        )
    if status and status != "ALL":
        query = query.filter(TaxRate.status == status.upper())
    return query.order_by(TaxRate.gst_percentage.asc()).all()

@router.post("", response_model=TaxRateResponse, status_code=status.HTTP_201_CREATED)
def create_tax_rate(
    body: TaxRateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if db.query(TaxRate).filter(TaxRate.tax_code.ilike(body.tax_code.strip())).first():
        raise HTTPException(status_code=400, detail="Tax code already exists")
    t = TaxRate(
        tax_code=body.tax_code.strip().upper(),
        tax_name=body.tax_name.strip(),
        gst_percentage=body.gst_percentage,
        hsn_code=body.hsn_code.strip(),
        tax_category=body.tax_category,
        effective_from=body.effective_from,
        effective_to=body.effective_to,
        status=body.status or "ACTIVE"
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    record_audit_log(
        db=db, module="TAX_RATES", action="CREATE",
        description=f"Created Tax Rate '{t.tax_name}' ({t.gst_percentage}%)",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=t.id, record_title=t.tax_name
    )
    return t

@router.put("/{tax_id}", response_model=TaxRateResponse)
def update_tax_rate(
    tax_id: str,
    body: TaxRateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    t = db.query(TaxRate).filter(TaxRate.id == tax_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tax rate not found")
    if body.tax_code:
        t.tax_code = body.tax_code.strip().upper()
    if body.tax_name:
        t.tax_name = body.tax_name.strip()
    if body.gst_percentage is not None:
        t.gst_percentage = body.gst_percentage
    if body.hsn_code:
        t.hsn_code = body.hsn_code.strip()
    if body.tax_category is not None:
        t.tax_category = body.tax_category
    if body.effective_from is not None:
        t.effective_from = body.effective_from
    if body.effective_to is not None:
        t.effective_to = body.effective_to
    if body.status:
        t.status = body.status
    db.commit()
    db.refresh(t)
    record_audit_log(
        db=db, module="TAX_RATES", action="UPDATE",
        description=f"Updated Tax Rate '{t.tax_name}' ({t.gst_percentage}%)",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=t.id, record_title=t.tax_name
    )
    return t

@router.delete("/{tax_id}", response_model=MessageResponse)
def delete_tax_rate(
    tax_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    t = db.query(TaxRate).filter(TaxRate.id == tax_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tax rate not found")
    name = t.tax_name

    record_audit_log(
        db=db, module="TAX_RATES", action="DELETE",
        description=f"Deleted Tax Rate '{name}'",
        user_name=current_user.full_name, user_id=current_user.id,
        record_id=tax_id, record_title=name
    )

    db.delete(t)
    db.commit()

    return {"message": f"Tax Rate '{name}' deleted successfully", "success": True}

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit import UserApproval
from app.models.user import User, UserPlant
from app.models.role import Role
from app.auth.dependencies import get_current_user
from app.services.audit_service import record_audit_log
from app.schemas.audit import ApprovalDecisionRequest
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/user-approvals", tags=["User Approvals"])

def serialize_approval(appr: UserApproval) -> dict:
    return {
        "id": appr.id,
        "user_id": appr.user_id,
        "user_name": appr.user.full_name if appr.user else "Unknown User",
        "user_email": appr.user.email if appr.user else None,
        "department_name": appr.user.department.name if (appr.user and appr.user.department) else None,
        "requested_role_id": appr.requested_role_id,
        "requested_role_name": appr.requested_role.name if appr.requested_role else None,
        "requested_plant_id": appr.requested_plant_id,
        "requested_plant_name": appr.requested_plant.name if appr.requested_plant else None,
        "requested_by": appr.requested_by,
        "status": appr.status,
        "decision_notes": appr.decision_notes,
        "decided_by": appr.decided_by,
        "decided_at": appr.decided_at,
        "created_at": appr.created_at
    }

@router.get("")
def list_approvals(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(UserApproval)
    if status and status != "ALL":
        query = query.filter(UserApproval.status == status.upper())
    approvals = query.order_by(UserApproval.created_at.desc()).all()
    return [serialize_approval(a) for a in approvals]

@router.post("/{approval_id}/decision")
def make_decision(
    approval_id: str,
    body: ApprovalDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    approval = db.query(UserApproval).filter(UserApproval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    decision = body.action.upper()
    if decision not in ["APPROVE", "REJECT"]:
        raise HTTPException(status_code=400, detail="Action must be APPROVE or REJECT")

    approval.status = "APPROVED" if decision == "APPROVE" else "REJECTED"
    approval.decision_notes = body.notes
    approval.decided_by = current_user.full_name
    approval.decided_at = datetime.now(timezone.utc)

    user = approval.user
    if user:
        if decision == "APPROVE":
            user.status = "ACTIVE"
            if approval.requested_role_id:
                user.role_id = approval.requested_role_id
            if approval.requested_plant_id:
                existing_plant = db.query(UserPlant).filter(
                    UserPlant.user_id == user.id,
                    UserPlant.plant_id == approval.requested_plant_id
                ).first()
                if not existing_plant:
                    db.add(UserPlant(user_id=user.id, plant_id=approval.requested_plant_id, is_primary=True))
        else:
            user.status = "INACTIVE"

    db.commit()
    db.refresh(approval)

    record_audit_log(
        db=db,
        module="USER_APPROVALS",
        action=decision,
        description=f"Admin {current_user.full_name} {decision.lower()}d user access request for {user.full_name if user else 'user'}",
        user_name=current_user.full_name,
        user_id=current_user.id,
        record_id=approval.id,
        record_title=user.full_name if user else "Approval Request"
    )

    return {"message": f"Request {decision.lower()}d successfully", "approval": serialize_approval(approval)}

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.models.department import Department
from app.models.plant import Plant
from app.models.audit import AuditLog, UserApproval
from app.models.master_data import (
    Product, Fabric, Yarn, Colour, Design, Loom, Artisan,
    Supplier, Customer, Warehouse, UOM, TaxRate
)
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.status == "ACTIVE").count()
    active_artisans = db.query(Artisan).filter(Artisan.status == "ACTIVE").count()
    total_plants = db.query(Plant).filter(Plant.status == "ACTIVE").count()
    pending_approvals = db.query(UserApproval).filter(UserApproval.status == "PENDING").count()

    # Sum of master records
    prod_count = db.query(Product).count()
    fab_count = db.query(Fabric).count()
    yarn_count = db.query(Yarn).count()
    colour_count = db.query(Colour).count()
    design_count = db.query(Design).count()
    loom_count = db.query(Loom).count()
    artisan_count = db.query(Artisan).count()
    supplier_count = db.query(Supplier).count()
    customer_count = db.query(Customer).count()
    warehouse_count = db.query(Warehouse).count()
    uom_count = db.query(UOM).count()
    tax_count = db.query(TaxRate).count()

    total_master_records = (
        prod_count + fab_count + yarn_count + colour_count +
        design_count + loom_count + artisan_count + supplier_count +
        customer_count + warehouse_count + uom_count + tax_count
    )

    # Users by department
    dept_rows = (
        db.query(Department.name, func.count(User.id))
        .outerjoin(User, User.department_id == Department.id)
        .group_by(Department.name)
        .all()
    )
    users_by_dept = [{"name": r[0], "count": r[1]} for r in dept_rows]

    # User status breakdown
    status_counts = (
        db.query(User.status, func.count(User.id))
        .group_by(User.status)
        .all()
    )
    user_status_data = [{"status": r[0], "count": r[1]} for r in status_counts]

    # Master data breakdown chart
    master_overview = [
        {"name": "Products", "count": prod_count, "color": "#1E2447"},
        {"name": "Fabrics", "count": fab_count, "color": "#0D766E"},
        {"name": "Yarns", "count": yarn_count, "color": "#4B286D"},
        {"name": "Designs", "count": design_count, "color": "#D97706"},
        {"name": "Artisans", "count": artisan_count, "color": "#BE185D"},
        {"name": "Suppliers", "count": supplier_count, "color": "#0284C7"}
    ]

    # Loom status breakdown
    loom_statuses = (
        db.query(Loom.status, func.count(Loom.id))
        .group_by(Loom.status)
        .all()
    )
    loom_status_data = [{"status": r[0], "count": r[1]} for r in loom_statuses]

    # Recent activity
    recent_logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(8)
        .all()
    )
    recent_activities = [
        {
            "id": l.id,
            "user_name": l.user_name,
            "module": l.module,
            "action": l.action,
            "record_title": l.record_title,
            "description": l.description,
            "created_at": l.created_at,
            "status": l.status
        }
        for l in recent_logs
    ]

    return {
        "kpis": {
            "total_users": total_users,
            "active_users": active_users,
            "master_records": total_master_records,
            "active_artisans": active_artisans,
            "production_units": total_plants,
            "pending_approvals": pending_approvals
        },
        "charts": {
            "users_by_dept": users_by_dept,
            "user_status": user_status_data,
            "master_overview": master_overview,
            "loom_status": loom_status_data
        },
        "recent_activities": recent_activities
    }

@router.get("/master-data-summary")
def get_master_data_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Summary counts for the Master Data hub landing page."""
    return {
        "products": db.query(Product).count(),
        "fabrics": db.query(Fabric).count(),
        "yarns": db.query(Yarn).count(),
        "colours": db.query(Colour).count(),
        "designs": db.query(Design).count(),
        "looms": db.query(Loom).count(),
        "artisans": db.query(Artisan).count(),
        "suppliers": db.query(Supplier).count(),
        "customers": db.query(Customer).count(),
        "warehouses": db.query(Warehouse).count(),
        "uom": db.query(UOM).count(),
        "tax_rates": db.query(TaxRate).count()
    }

import io
import csv
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.master_data import Product, Fabric, Yarn, Artisan, Loom, Supplier, Customer
from app.models.department import Department
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary")
def get_reports_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_count = db.query(User).count()
    active_user_count = db.query(User).filter(User.status == "ACTIVE").count()
    product_count = db.query(Product).count()
    fabric_count = db.query(Fabric).count()
    yarn_count = db.query(Yarn).count()
    artisan_count = db.query(Artisan).count()
    loom_count = db.query(Loom).count()
    supplier_count = db.query(Supplier).count()
    customer_count = db.query(Customer).count()

    return {
        "user_reports": {
            "total_users": user_count,
            "active_users": active_user_count,
            "inactive_users": user_count - active_user_count
        },
        "master_reports": {
            "products": product_count,
            "fabrics": fabric_count,
            "yarns": yarn_count,
            "artisans": artisan_count,
            "looms": loom_count,
            "suppliers": supplier_count,
            "customers": customer_count
        }
    }

@router.get("/export-csv/{report_type}")
def export_csv(
    report_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "users":
        writer.writerow(["Employee ID", "First Name", "Last Name", "Email", "Phone", "Role", "Department", "Status", "Last Login"])
        users = db.query(User).all()
        for u in users:
            writer.writerow([
                u.employee_id, u.first_name, u.last_name, u.email, u.phone or "",
                u.role.name if u.role else "",
                u.department.name if u.department else "",
                u.status,
                u.last_login.strftime("%Y-%m-%d %H:%M") if u.last_login else "Never"
            ])
        filename = "loomora_users_report.csv"

    elif report_type == "products":
        writer.writerow(["Product Code", "Name", "Category", "Selling Price", "Cost Price", "Status", "Fabric", "Colour"])
        prods = db.query(Product).all()
        for p in prods:
            writer.writerow([
                p.code, p.name, p.category, p.selling_price, p.cost_price, p.status,
                p.fabric.name if p.fabric else "",
                p.colour.name if p.colour else ""
            ])
        filename = "loomora_products_report.csv"

    elif report_type == "fabrics":
        writer.writerow(["Fabric Code", "Name", "Type", "Composition", "GSM", "Width (in)", "Status", "Supplier"])
        fabs = db.query(Fabric).all()
        for f in fabs:
            writer.writerow([
                f.code, f.name, f.fabric_type, f.composition, f.gsm or "", f.width_inches or "",
                f.status, f.supplier.name if f.supplier else ""
            ])
        filename = "loomora_fabrics_report.csv"

    elif report_type == "artisans":
        writer.writerow(["Artisan Code", "Name", "Phone", "Location", "Skill Level", "Specialization", "Experience (Yrs)", "Status"])
        artisans = db.query(Artisan).all()
        for a in artisans:
            writer.writerow([
                a.artisan_code, a.name, a.phone or "", a.location,
                a.skill_level, a.specialization, a.experience_years, a.status
            ])
        filename = "loomora_artisans_report.csv"

    elif report_type == "looms":
        writer.writerow(["Loom Number", "Type", "Plant", "Capacity (m/day)", "Width (in)", "Assigned Artisan", "Status"])
        looms = db.query(Loom).all()
        for l in looms:
            writer.writerow([
                l.loom_number, l.loom_type, l.plant.name if l.plant else "",
                l.capacity_meters_per_day, l.width_inches,
                l.assigned_artisan.name if l.assigned_artisan else "Unassigned",
                l.status
            ])
        filename = "loomora_looms_report.csv"

    elif report_type == "suppliers":
        writer.writerow(["Supplier Code", "Name", "Contact Person", "Email", "Phone", "City", "GST", "Materials Supplied", "Status"])
        suppliers = db.query(Supplier).all()
        for s in suppliers:
            writer.writerow([
                s.supplier_code, s.name, s.contact_person or "", s.email or "", s.phone or "",
                s.city or "", s.gst_number or "", s.materials_supplied or "", s.status
            ])
        filename = "loomora_suppliers_report.csv"

    elif report_type == "customers":
        writer.writerow(["Customer Code", "Name", "Type", "Contact Person", "Email", "Phone", "City", "Credit Limit", "Status"])
        customers = db.query(Customer).all()
        for c in customers:
            writer.writerow([
                c.customer_code, c.name, c.customer_type or "", c.contact_person or "", c.email or "",
                c.phone or "", c.city or "", c.credit_limit or 0, c.status
            ])
        filename = "loomora_customers_report.csv"

    else:
        writer.writerow(["Message"])
        writer.writerow(["Unknown report type"])
        filename = "report.csv"

    content = output.getvalue()
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

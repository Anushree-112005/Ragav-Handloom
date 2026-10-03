import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import (
    User, Product, Fabric, Yarn, Colour, Design, Artisan, Loom,
    Supplier, Customer, Warehouse, UOM, TaxRate, Department, Plant,
    AuditLog, LoginActivity, UserApproval, Role
)

def verify():
    db = SessionLocal()
    counts = {
        "Users": db.query(User).count(),
        "Roles": db.query(Role).count(),
        "Departments": db.query(Department).count(),
        "Plants": db.query(Plant).count(),
        "Products": db.query(Product).count(),
        "Fabrics": db.query(Fabric).count(),
        "Yarns": db.query(Yarn).count(),
        "Colours": db.query(Colour).count(),
        "Designs": db.query(Design).count(),
        "Artisans": db.query(Artisan).count(),
        "Looms": db.query(Loom).count(),
        "Suppliers": db.query(Supplier).count(),
        "Customers": db.query(Customer).count(),
        "Warehouses": db.query(Warehouse).count(),
        "UOM": db.query(UOM).count(),
        "Tax Rates": db.query(TaxRate).count(),
        "Audit Logs": db.query(AuditLog).count(),
        "Login Activities": db.query(LoginActivity).count(),
        "User Approvals": db.query(UserApproval).count()
    }
    db.close()
    print("LOOMORA ERP Database Verification Summary:")
    for k, v in counts.items():
        print(f"  [OK] {k}: {v}")

if __name__ == "__main__":
    verify()

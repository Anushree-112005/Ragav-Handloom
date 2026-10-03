import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.database import SessionLocal
from app.models.user import User, UserPlant
from app.models.role import Role
from app.models.department import Department
from app.models.plant import Plant
from app.auth.security import get_password_hash

db = SessionLocal()

roles = {r.code: r for r in db.query(Role).all()}
depts = {d.code: d for d in db.query(Department).all()}
plants = {p.code: p for p in db.query(Plant).all()}

demo_accounts = [
    {
        "emp": "EMP-DEMO-01",
        "first": "Production",
        "last": "Manager",
        "email": "production@loomora.com",
        "role_code": "PROD_MANAGER",
        "dept_code": "WEAV",
        "desig": "Production Manager",
        "pwd": "Prod@123"
    },
    {
        "emp": "EMP-DEMO-02",
        "first": "Master",
        "last": "Weaver",
        "email": "weaver@loomora.com",
        "role_code": "WEAVER_OP",
        "dept_code": "WEAV",
        "desig": "Senior Handloom Weaver",
        "pwd": "Weaver@123"
    },
    {
        "emp": "EMP-DEMO-03",
        "first": "Inventory",
        "last": "Manager",
        "email": "inventory@loomora.com",
        "role_code": "INV_MANAGER",
        "dept_code": "WHSE",
        "desig": "Yarn & Fabric Store Manager",
        "pwd": "Stock@123"
    },
    {
        "emp": "EMP-DEMO-04",
        "first": "Quality",
        "last": "Inspector",
        "email": "quality@loomora.com",
        "role_code": "QC_MANAGER",
        "dept_code": "QCTL",
        "desig": "Chief Quality Inspector",
        "pwd": "Quality@123"
    },
    {
        "emp": "EMP-DEMO-05",
        "first": "HR",
        "last": "Manager",
        "email": "hr@loomora.com",
        "role_code": "HR_MANAGER",
        "dept_code": "HRAD",
        "desig": "Human Resources Manager",
        "pwd": "Admin@123"
    }
]

for d in demo_accounts:
    existing = db.query(User).filter(User.email == d["email"]).first()
    if existing:
        existing.password_hash = get_password_hash(d["pwd"])
        existing.status = "ACTIVE"
        print(f"Updated password for {d['email']}")
    else:
        u = User(
            employee_id=d["emp"],
            first_name=d["first"],
            last_name=d["last"],
            email=d["email"],
            password_hash=get_password_hash(d["pwd"]),
            department_id=depts.get(d["dept_code"]).id if depts.get(d["dept_code"]) else None,
            role_id=roles[d["role_code"]].id,
            designation=d["desig"],
            status="ACTIVE",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
        )
        db.add(u)
        db.flush()
        if plants:
            up = UserPlant(user_id=u.id, plant_id=list(plants.values())[0].id, is_primary=True)
            db.add(up)
        print(f"Created demo account: {d['email']} (Role: {d['role_code']})")

db.commit()
print("All demo accounts successfully configured in PostgreSQL!")
db.close()

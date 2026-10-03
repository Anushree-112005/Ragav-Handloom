import os
import sys
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from app.database import SessionLocal, Base, engine
from app.auth.security import get_password_hash
from app.models import (
    Role, RolePermission, Department, Plant, User, UserPlant,
    AuditLog, LoginActivity, UserApproval,
    UOM, TaxRate, Colour, Design, Supplier, Customer, Warehouse,
    Fabric, Yarn, Product, Artisan, Loom,
    ProductionOrder, InventoryItem, PurchaseOrder, SalesOrder, QualityInspection
)

def seed():
    db: Session = SessionLocal()
    print("Beginning LOOMORA ERP Seed Data Generation...")

    # Check if already seeded
    if db.query(User).filter(User.email == "admin@loomora.com").first():
        print("Database already contains seeded admin. Skipping seed or clearing...")
        # We can continue safely or return
        return

    # 1. ROLES & PERMISSIONS
    print("Seeding Roles and Module Permission Matrix...")
    modules = [
        "DASHBOARD", "USERS", "ROLES", "DEPARTMENTS", "PLANTS",
        "MASTER_DATA", "PRODUCTION", "INVENTORY", "PURCHASE",
        "SALES", "QUALITY", "REPORTS", "SETTINGS"
    ]

    roles_data = [
        {"name": "Super Administrator", "code": "SUPER_ADMIN", "desc": "Full unrestricted system-wide access", "is_system": True},
        {"name": "HR Manager", "code": "HR_MANAGER", "desc": "User management, recruitment and access control", "is_system": True},
        {"name": "Production Manager", "code": "PROD_MANAGER", "desc": "Oversees loom production, weavers and orders", "is_system": False},
        {"name": "Production Supervisor", "code": "PROD_SUPERVISOR", "desc": "Floor supervision, daily loom allocation", "is_system": False},
        {"name": "Inventory Manager", "code": "INV_MANAGER", "desc": "Manages raw yarns, dyes and finished textiles", "is_system": False},
        {"name": "Purchase Manager", "code": "PURCH_MANAGER", "desc": "Procurement from yarn and fiber suppliers", "is_system": False},
        {"name": "Sales Manager", "code": "SALES_MANAGER", "desc": "Client relations, wholesale orders and retail distribution", "is_system": False},
        {"name": "Quality Manager", "code": "QC_MANAGER", "desc": "Inspection of fabrics, yarn grade tests and GSM audit", "is_system": False},
        {"name": "Finance Manager", "code": "FIN_MANAGER", "desc": "GST compliance, invoices, payments and accounting", "is_system": False},
        {"name": "Weaver / Operator", "code": "WEAVER_OP", "desc": "Loom operation, daily output reporting", "is_system": False},
    ]

    role_objs = {}
    for r in roles_data:
        role = Role(name=r["name"], code=r["code"], description=r["desc"], is_system=r["is_system"])
        db.add(role)
        db.flush()
        role_objs[r["code"]] = role

        is_admin = (r["code"] == "SUPER_ADMIN")
        for mod in modules:
            perm = RolePermission(
                role_id=role.id,
                module=mod,
                can_view=True,
                can_create=True if (is_admin or (r["code"] == "HR_MANAGER" and mod in ["USERS", "DEPARTMENTS"])) else False,
                can_edit=True if (is_admin or (r["code"] == "PROD_MANAGER" and mod in ["PRODUCTION", "MASTER_DATA"])) else False,
                can_delete=True if is_admin else False,
                can_approve=True if (is_admin or "MANAGER" in r["code"]) else False,
                can_export=True if (is_admin or "MANAGER" in r["code"]) else False,
            )
            db.add(perm)

    # 2. PLANTS / MANUFACTURING UNITS
    print("Seeding Manufacturing Plants...")
    plants_data = [
        {"code": "PLANT-ERD", "name": "Erode Weaving Cluster", "loc": "Perundurai Road, Erode, Tamil Nadu", "mgr": "Karthik Rajan", "phone": "+91 98421 11223", "email": "erode.plant@loomora.com"},
        {"code": "PLANT-CBE", "name": "Coimbatore Spinning Unit", "loc": "Avinashi Road, Coimbatore, Tamil Nadu", "mgr": "Sundaramurthy V", "phone": "+91 94432 44556", "email": "cbe.spinning@loomora.com"},
        {"code": "PLANT-TPR", "name": "Tiruppur Processing & Dyeing", "loc": "Dharapuram Road, Tiruppur, Tamil Nadu", "mgr": "Anandhi Natarajan", "phone": "+91 98943 77889", "email": "tiruppur.dyeing@loomora.com"},
        {"code": "PLANT-CHE", "name": "Chennai Corporate Office", "loc": "Nungambakkam High Road, Chennai, Tamil Nadu", "mgr": "Radhakrishnan K", "phone": "+91 94440 99001", "email": "hq.chennai@loomora.com"}
    ]
    plant_objs = {}
    for p in plants_data:
        pl = Plant(code=p["code"], name=p["name"], location=p["loc"], manager_name=p["mgr"], contact_phone=p["phone"], email=p["email"], status="ACTIVE")
        db.add(pl)
        db.flush()
        plant_objs[p["code"]] = pl

    # 3. DEPARTMENTS
    print("Seeding Departments...")
    depts_data = [
        {"code": "WEAV", "name": "Handloom Weaving", "desc": "Traditional pit and frame handloom operations", "head": "Arun Kumar", "plant": "PLANT-ERD"},
        {"code": "SPIN", "name": "Spinning & Warping", "desc": "Cotton and wild silk yarn spinning and warping", "head": "Kavitha Selvam", "plant": "PLANT-CBE"},
        {"code": "DYEP", "name": "Natural Dyeing & Processing", "desc": "Vegetable dyeing, mordanting and yarn washing", "head": "Murugan Velu", "plant": "PLANT-TPR"},
        {"code": "DSGN", "name": "Textile Design & CAD", "desc": "Jacquard cards, traditional motif archives", "head": "Priya Darshini", "plant": "PLANT-CHE"},
        {"code": "QCTL", "name": "Quality Inspection", "desc": "Tensile testing, GSM audit and defect inspection", "head": "Ganesh Moorthy", "plant": "PLANT-ERD"},
        {"code": "WHSE", "name": "Central Warehouse & Logistics", "desc": "Storage of yarns, grey cloth and finished sarees", "head": "Saravanan R", "plant": "PLANT-ERD"},
        {"code": "PURC", "name": "Raw Material Procurement", "desc": "Sourcing mulberry silk, organic cotton and natural dyes", "head": "Manickam Chettiar", "plant": "PLANT-CBE"},
        {"code": "SALE", "name": "Sales & Retail Distribution", "desc": "Wholesale distribution and boutique relations", "head": "Deepa Sundar", "plant": "PLANT-CHE"},
        {"code": "FINC", "name": "Finance & Taxation", "desc": "Accounts, GST filing and artisan payments", "head": "Balasubramanian T", "plant": "PLANT-CHE"},
        {"code": "HRAD", "name": "Human Resources & Welfare", "desc": "Artisan welfare, staff administration", "head": "Meenakshi Raman", "plant": "PLANT-CHE"},
        {"code": "MAIN", "name": "Loom Maintenance & Engineering", "desc": "Loom servicing, wooden frame repairs", "head": "Thangavelu P", "plant": "PLANT-ERD"},
    ]
    dept_objs = {}
    for d in depts_data:
        dp = Department(code=d["code"], name=d["name"], description=d["desc"], department_head=d["head"], plant_id=plant_objs[d["plant"]].id, status="ACTIVE")
        db.add(dp)
        db.flush()
        dept_objs[d["code"]] = dp

    # 4. USERS (22 realistic Indian textile professionals)
    print("Seeding 22 System Users...")
    hashed_pwd = get_password_hash("Admin@123")

    users_data = [
        {"emp": "EMP-1001", "first": "Super", "last": "Admin", "email": "admin@loomora.com", "role": "SUPER_ADMIN", "dept": "HRAD", "desig": "Chief Executive Officer", "phone": "+91 98400 12345"},
        {"emp": "EMP-1002", "first": "Arun", "last": "Kumar", "email": "arun.kumar@loomora.com", "role": "PROD_MANAGER", "dept": "WEAV", "desig": "Senior Production Manager", "phone": "+91 98411 23456"},
        {"emp": "EMP-1003", "first": "Priya", "last": "Devi", "email": "priya.devi@loomora.com", "role": "HR_MANAGER", "dept": "HRAD", "desig": "Human Resources Director", "phone": "+91 98422 34567"},
        {"emp": "EMP-1004", "first": "Karthik", "last": "Raj", "email": "karthik.raj@loomora.com", "role": "PROD_SUPERVISOR", "dept": "WEAV", "desig": "Weaving Floor Supervisor", "phone": "+91 98433 45678"},
        {"emp": "EMP-1005", "first": "Meena", "last": "Sundaram", "email": "meena.s@loomora.com", "role": "QC_MANAGER", "dept": "QCTL", "desig": "Quality Assurance Lead", "phone": "+91 98444 56789"},
        {"emp": "EMP-1006", "first": "Saravanan", "last": "Ramasamy", "email": "saravanan.r@loomora.com", "role": "INV_MANAGER", "dept": "WHSE", "desig": "Central Logistics Manager", "phone": "+91 98455 67890"},
        {"emp": "EMP-1007", "first": "Manickam", "last": "Chettiar", "email": "manickam.c@loomora.com", "role": "PURCH_MANAGER", "dept": "PURC", "desig": "Head of Yarn Procurement", "phone": "+91 98466 78901"},
        {"emp": "EMP-1008", "first": "Deepa", "last": "Sundar", "email": "deepa.sundar@loomora.com", "role": "SALES_MANAGER", "dept": "SALE", "desig": "VP of Global Distribution", "phone": "+91 98477 89012"},
        {"emp": "EMP-1009", "first": "Balasubramanian", "last": "Thirunavukarasu", "email": "bala.t@loomora.com", "role": "FIN_MANAGER", "dept": "FINC", "desig": "Chief Financial Officer", "phone": "+91 98488 90123"},
        {"emp": "EMP-1010", "first": "Murugan", "last": "Velu", "email": "murugan.v@loomora.com", "role": "PROD_SUPERVISOR", "dept": "DYEP", "desig": "Master Dye Specialist", "phone": "+91 98499 01234"},
        {"emp": "EMP-1011", "first": "Kavitha", "last": "Selvam", "email": "kavitha.selvam@loomora.com", "role": "PROD_SUPERVISOR", "dept": "SPIN", "desig": "Spinning Operations Head", "phone": "+91 98500 12345"},
        {"emp": "EMP-1012", "first": "Priya", "last": "Darshini", "email": "priya.cad@loomora.com", "role": "PROD_SUPERVISOR", "dept": "DSGN", "desig": "Chief Textile Designer", "phone": "+91 98511 23456"},
        {"emp": "EMP-1013", "first": "Thangavelu", "last": "Periyasamy", "email": "thangavelu.p@loomora.com", "role": "PROD_SUPERVISOR", "dept": "MAIN", "desig": "Chief Loom Technician", "phone": "+91 98522 34567"},
        {"emp": "EMP-1014", "first": "Senthil", "last": "Nathan", "email": "senthil.nathan@loomora.com", "role": "WEAVER_OP", "dept": "WEAV", "desig": "Jacquard Master Weaver", "phone": "+91 98533 45678"},
        {"emp": "EMP-1015", "first": "Lakshmi", "last": "Narayanan", "email": "lakshmi.n@loomora.com", "role": "WEAVER_OP", "dept": "WEAV", "desig": "Mulberry Silk Weaver", "phone": "+91 98544 56789"},
        {"emp": "EMP-1016", "first": "Muthusamy", "last": "Gounder", "email": "muthusamy.g@loomora.com", "role": "WEAVER_OP", "dept": "WEAV", "desig": "Khadi Cotton Weaver", "phone": "+91 98555 67890"},
        {"emp": "EMP-1017", "first": "Shanthi", "last": "Ramesh", "email": "shanthi.r@loomora.com", "role": "QC_MANAGER", "dept": "QCTL", "desig": "Fabric Quality Inspector", "phone": "+91 98566 78901"},
        {"emp": "EMP-1018", "first": "Venkatesh", "last": "Prasad", "email": "venkatesh.p@loomora.com", "role": "INV_MANAGER", "dept": "WHSE", "desig": "Inventory Control Officer", "phone": "+91 98577 89012"},
        {"emp": "EMP-1019", "first": "Bhuvaneshwari", "last": "K", "email": "bhuvaneshwari.k@loomora.com", "role": "PURCH_MANAGER", "dept": "PURC", "desig": "Supplier Relations Executive", "phone": "+91 98588 90123"},
        {"emp": "EMP-1020", "first": "Vignesh", "last": "Subramanian", "email": "vignesh.s@loomora.com", "role": "SALES_MANAGER", "dept": "SALE", "desig": "Boutique Accounts Officer", "phone": "+91 98599 01234"},
        {"emp": "EMP-1021", "first": "Rajeswari", "last": "Mohan", "email": "rajeswari.m@loomora.com", "role": "HR_MANAGER", "dept": "HRAD", "desig": "Artisan Welfare Coordinator", "phone": "+91 98600 12345"},
        {"emp": "EMP-1022", "first": "Aakash", "last": "Chauhan", "email": "aakash.c@loomora.com", "role": "WEAVER_OP", "dept": "WEAV", "desig": "Apprentice Weaver", "phone": "+91 98611 23456"}
    ]

    user_objs = {}
    for idx, u in enumerate(users_data):
        user = User(
            employee_id=u["emp"],
            first_name=u["first"],
            last_name=u["last"],
            email=u["email"],
            phone=u["phone"],
            password_hash=hashed_pwd,
            department_id=dept_objs[u["dept"]].id,
            role_id=role_objs[u["role"]].id,
            designation=u["desig"],
            status="ACTIVE" if idx != 21 else "PENDING_APPROVAL",
            avatar_url=None,
            last_login=datetime.now(timezone.utc) - timedelta(hours=idx*3 + 1)
        )
        db.add(user)
        db.flush()
        user_objs[u["emp"]] = user

        # Assign plant access
        p_code = "PLANT-ERD" if idx % 3 == 0 else ("PLANT-CBE" if idx % 3 == 1 else "PLANT-CHE")
        up = UserPlant(user_id=user.id, plant_id=plant_objs[p_code].id, is_primary=True)
        db.add(up)

    # 5. UOM (Units of Measure)
    print("Seeding Units of Measure...")
    uoms_data = [
        {"code": "MTR", "name": "Meter", "desc": "Standard length metric for fabrics and warps"},
        {"code": "KGS", "name": "Kilogram", "desc": "Weight measurement for yarn cones, raw silk, and chemicals"},
        {"code": "PCS", "name": "Piece", "desc": "Individual finished garments, shawls, and stoles"},
        {"code": "SRE", "name": "Saree (6.25m)", "desc": "Standard single saree cut with unstitched blouse piece"},
        {"code": "CON", "name": "Cone", "desc": "Wound yarn cones for automated warp creeling"},
        {"code": "HNK", "name": "Hank", "desc": "Reeled yarn bundles for hand dyeing and warping"},
        {"code": "BDL", "name": "Bundle", "desc": "Package of 10-20 hanks or yardage packages"},
        {"code": "ROL", "name": "Roll / Bolt", "desc": "Fabric roll of 50-100 meters length"}
    ]
    uom_objs = {}
    for u in uoms_data:
        um = UOM(code=u["code"], name=u["name"], description=u["desc"], status="ACTIVE")
        db.add(um)
        db.flush()
        uom_objs[u["code"]] = um

    # 6. TAX / GST RATES
    print("Seeding Tax / GST Master...")
    taxes_data = [
        {"code": "GST-COT-05", "name": "Handloom Cotton Fabrics (5%)", "rate": 5.0, "hsn": "5208", "cat": "Handloom Textiles"},
        {"code": "GST-SLK-12", "name": "Pure Silk Handloom Saree (12%)", "rate": 12.0, "hsn": "5007", "cat": "Silk Products"},
        {"code": "GST-CHM-18", "name": "Natural & Vat Dyes (18%)", "rate": 18.0, "hsn": "3204", "cat": "Chemicals & Dyes"},
        {"code": "GST-KHD-00", "name": "Raw Khadi Fiber (0% Exempt)", "rate": 0.0, "hsn": "5201", "cat": "Artisan Fiber"},
        {"code": "GST-APL-05", "name": "Handwoven Ready Apparel (5%)", "rate": 5.0, "hsn": "6204", "cat": "Apparel"}
    ]
    tax_objs = {}
    for t in taxes_data:
        tx = TaxRate(tax_code=t["code"], tax_name=t["name"], gst_percentage=t["rate"], hsn_code=t["hsn"], tax_category=t["cat"], effective_from="2024-01-01", status="ACTIVE")
        db.add(tx)
        db.flush()
        tax_objs[t["code"]] = tx

    # 7. COLOUR MASTER (16 rich colours with hex codes & dye types)
    print("Seeding Colours...")
    colours_data = [
        {"code": "CLR-IND", "name": "Deep Royal Indigo", "fam": "Blue", "hex": "#1C3F60", "dye": "Natural Vegetable Indigo", "desc": "Extracted from Indigofera tinctoria leaves"},
        {"code": "CLR-MDR", "name": "Madder Ruby Red", "fam": "Red", "hex": "#9B111E", "dye": "Natural Rubia Root", "desc": "Warm traditional ruby red derived from madder roots"},
        {"code": "CLR-TUR", "name": "Warm Temple Saffron", "fam": "Yellow", "hex": "#E49B0F", "dye": "Turmeric & Pomegranate", "desc": "Auspicious deep saffron yellow"},
        {"code": "CLR-EMR", "name": "Emerald Forest", "fam": "Green", "hex": "#0D5C3A", "dye": "Indigo & Myrobalan", "desc": "Lush evergreen hue prized in Kanchipuram borders"},
        {"code": "CLR-PUR", "name": "Royal Kanchi Purple", "fam": "Purple", "hex": "#4E148C", "dye": "Azo-Free Vat Dye", "desc": "Imperial purple used in contrasting saree pallus"},
        {"code": "CLR-COR", "name": "Coral Sindoor", "fam": "Coral", "hex": "#F43F5E", "dye": "Reactive Low-Impact Dye", "desc": "Vibrant glowing coral accent tone"},
        {"code": "CLR-TEA", "name": "Nilgiri Teal", "fam": "Teal", "hex": "#0D7C85", "dye": "Low-Impact Azo-Free Dye", "desc": "Cool jewel-toned deep teal"},
        {"code": "CLR-IVR", "name": "Raw Silk Ivory", "fam": "White / Ivory", "hex": "#FAF5E9", "dye": "Natural Bleach-Free", "desc": "Unbleached organic tussar cream tone"},
        {"code": "CLR-MUS", "name": "Golden Mustard", "fam": "Yellow", "hex": "#D4A313", "dye": "Marigold Flower Extract", "desc": "Warm antique golden ochre"},
        {"code": "CLR-MAG", "name": "Rani Rani Magenta", "fam": "Pink", "hex": "#C026D3", "dye": "Natural Lac Dye", "desc": "Electric festive magenta traditionally from lac resin"},
        {"code": "CLR-TRQ", "name": "Peacock Turquoise", "fam": "Teal", "hex": "#14B8A6", "dye": "Low-Impact Reactive Dye", "desc": "Radiant green-blue reminiscent of peacock neck feathers"},
        {"code": "CLR-MAR", "name": "Chettinad Maroon", "fam": "Red", "hex": "#6B1D2F", "dye": "Vat Dye High Fastness", "desc": "Earthy dark maroon typical of Chettinad checks"},
        {"code": "CLR-OLI", "name": "Heritage Olive", "fam": "Green", "hex": "#556B2F", "dye": "Eucalyptus Bark Extract", "desc": "Earthy muted olive green with subtle sheen"},
        {"code": "CLR-TER", "name": "Terracotta Amber", "fam": "Brown / Orange", "hex": "#C85A32", "dye": "Natural Red Clay & Madder", "desc": "Earthy warm fired brick tone"},
        {"code": "CLR-CHA", "name": "Kohl Charcoal", "fam": "Black / Grey", "hex": "#27272A", "dye": "Iron Mordant & Myrobalan", "desc": "Deep matte carbon grey used in border outlines"},
        {"code": "CLR-LAV", "name": "Dusk Lavender", "fam": "Purple", "hex": "#A78BFA", "dye": "Low-Impact Reactive", "desc": "Gentle pastel violet for contemporary handloom lines"}
    ]
    colour_objs = {}
    for c in colours_data:
        cl = Colour(code=c["code"], name=c["name"], colour_family=c["fam"], hex_code=c["hex"], dye_type=c["dye"], description=c["desc"], status="ACTIVE")
        db.add(cl)
        db.flush()
        colour_objs[c["code"]] = cl

    # 8. DESIGNS & PATTERNS (12 authentic Indian motifs)
    print("Seeding Designs & Patterns...")
    designs_data = [
        {"code": "DSG-TMP-01", "name": "Gopuram Temple Spire Border", "type": "Border Pattern", "motif": "Temple Triangles", "col": "Heritage Temple Collection", "img": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80"},
        {"code": "DSG-PSY-02", "name": "Manga Paisley (Kalga Motif)", "type": "All-over Butta", "motif": "Traditional Paisley Mango", "col": "Royal Kanchipuram", "img": "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=500&auto=format&fit=crop&q=80"},
        {"code": "DSG-RUD-03", "name": "Rudraksha Sacred Bead Border", "type": "Border Motif", "motif": "Rudraksha Seeds", "col": "Auspicious Weaves", "img": "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=500&auto=format&fit=crop&q=80"},
        {"code": "DSG-MAY-04", "name": "Mayil Peacock Dancing Motif", "type": "Pallu Feature", "motif": "Peacock with Plumes", "col": "Flora & Fauna Series", "img": "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&auto=format&fit=crop&q=80"},
        {"code": "DSG-IKT-05", "name": "Double Ikat Geometric Chevron", "type": "Geometric Weave", "motif": "Lattice & Chevrons", "col": "Pochampally Contemporary", "img": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=80"},
        {"code": "DSG-JAL-06", "name": "Mughal Floral Jaal", "type": "Floral Grid", "motif": "Interlocking Vines & Lotus", "col": "Banarasi Grandeur", "img": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80"},
        {"code": "DSG-CHK-07", "name": "Chettinad Koodai Checks", "type": "Plaids & Checks", "motif": "Bold Windowpane Squares", "col": "Chettinad Heritage", "img": "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=500&auto=format&fit=crop&q=80"},
        {"code": "DSG-JMD-08", "name": "Jamdani Discontinuous Weft", "type": "Floral Inlay", "motif": "Floating Jasmine Florets", "col": "Bengal Craft", "img": "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=500&auto=format&fit=crop&q=80"},
        {"code": "DSG-ANX-09", "name": "Annam Swan Sacred Motif", "type": "Butta Accent", "motif": "Mythical Annam Bird", "col": "Royal Heritage", "img": "https://images.unsplash.com/photo-1544441893-675973e31985?w=500&auto=format&fit=crop&q=80"},
        {"code": "DSG-STR-10", "name": "Dobby Warp Stripes", "type": "Linear Stripe", "motif": "Micro Thread Ribs", "col": "Khadi Minimalist", "img": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=80"},
        {"code": "DSG-SHI-11", "name": "Shikargah Hunting Scene", "type": "Scenic Narrative", "motif": "Animals in Royal Forest", "col": "Masterpiece Vault", "img": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80"},
        {"code": "DSG-PLN-12", "name": "Zero-Pattern Raw Weave", "type": "Plain Weave", "motif": "Pure Slub Texture", "col": "Pure Organic Linen", "img": "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=500&auto=format&fit=crop&q=80"}
    ]
    design_objs = {}
    for d in designs_data:
        ds = Design(code=d["code"], name=d["name"], pattern_type=d["type"], motif=d["motif"], collection=d["col"], reference_image_url=None, status="ACTIVE")
        db.add(ds)
        db.flush()
        design_objs[d["code"]] = ds

    # 9. SUPPLIERS (11 reputable textile suppliers)
    print("Seeding Suppliers...")
    suppliers_data = [
        {"code": "SUP-SLM-01", "name": "Salem Yarn Traders Ltd", "cp": "T. Sengottaiyan", "email": "sales@salemyarn.com", "phone": "+91 94432 10101", "city": "Salem", "mat": "60s & 80s Combed Cotton Yarn", "gst": "33AAACS1234F1Z1"},
        {"code": "SUP-KNC-02", "name": "Kanchipuram Silk Co-operative Federation", "cp": "S. Vedachalam", "email": "info@kanchisilkfed.org", "phone": "+91 94433 20202", "city": "Kanchipuram", "mat": "Raw Mulberry Filature Silk", "gst": "33AAAKF5678K1Z2"},
        {"code": "SUP-ERD-03", "name": "Erode Organic Dyes & Extracts", "cp": "R. Loganathan", "email": "contact@erodedyes.in", "phone": "+91 94434 30303", "city": "Erode", "mat": "Natural Indigo Cakes, Madder, Myrobalan", "gst": "33AABCE9012L1Z3"},
        {"code": "SUP-TPR-04", "name": "Tiruppur Compact Yarns Pvt Ltd", "cp": "P. Sivakumar", "email": "orders@tiruppurcompact.com", "phone": "+91 94435 40404", "city": "Tiruppur", "mat": "GOTS Certified Organic Cotton Yarn", "gst": "33AACCT3456M1Z4"},
        {"code": "SUP-BGL-05", "name": "Bhagalpur Ahimsa Silk Syndicate", "cp": "M. K. Jha", "email": "bhagalpur.silk@gmail.com", "phone": "+91 98350 50505", "city": "Bhagalpur", "mat": "Eri Wild Silk & Raw Tussar Yarn", "gst": "10AABCB7890N1Z5"},
        {"code": "SUP-SUT-06", "name": "Surat Pure Zari Works", "cp": "Hasmukh Patel", "email": "suratzari@pateltextiles.com", "phone": "+91 98251 60606", "city": "Surat", "mat": "Pure Silver Electroplated Zari Threads", "gst": "24AAACS1122P1Z6"},
        {"code": "SUP-CBE-07", "name": "Coimbatore Textile Auxiliaries", "cp": "K. Govindaraj", "email": "info@cbtextileaux.com", "phone": "+91 94437 70707", "city": "Coimbatore", "mat": "Sizing starch, softening enzymes", "gst": "33AABCC3344Q1Z7"},
        {"code": "SUP-KOL-08", "name": "Bengal Handspun Khadi Samity", "cp": "Debabrata Sen", "email": "khadibengal@gov.in", "phone": "+91 98310 80808", "city": "Kolkata", "mat": "Handspun 100s Muslin Yarn Hanks", "gst": "19AABCK5566R1Z8"},
        {"code": "SUP-MDU-09", "name": "Madurai Sungudi Dyes & Wax", "cp": "N. Ramachandran", "email": "sungudidyes@madurai.in", "phone": "+91 94439 90909", "city": "Madurai", "mat": "Resist dyeing wax, reactive dyes", "gst": "33AABCM7788S1Z9"},
        {"code": "SUP-HYD-10", "name": "Pochampally Weavers Federation", "cp": "G. Mallesh", "email": "pochampally.coop@telangana.in", "phone": "+91 98480 11111", "city": "Hyderabad", "mat": "Mercerized 2/120s cotton & silk yarn", "gst": "36AABCP9900T1Z0"},
        {"code": "SUP-VNS-11", "name": "Varanasi Brocade Guild", "cp": "Rameshwar Mishra", "email": "guild@varanasibrocade.com", "phone": "+91 98390 22222", "city": "Varanasi", "mat": "Tested Gold Zari & Chiffon Warp", "gst": "09AABCV2233U1Z1"}
    ]
    supplier_objs = {}
    for s in suppliers_data:
        sp = Supplier(supplier_code=s["code"], name=s["name"], contact_person=s["cp"], email=s["email"], phone=s["phone"], city=s["city"], materials_supplied=s["mat"], gst_number=s["gst"], status="ACTIVE")
        db.add(sp)
        db.flush()
        supplier_objs[s["code"]] = sp

    # 10. CUSTOMERS (11 prestigious retailers and boutiques)
    print("Seeding Customers...")
    customers_data = [
        {"code": "CUST-FAB-01", "name": "FabIndia Heritage Retails Ltd", "type": "Retail Chain", "cp": "Sunita Kapoor", "email": "procurement@fabindia.com", "phone": "+91 98110 11111", "city": "New Delhi", "credit": 5000000.0, "gst": "07AAACF1234A1Z1"},
        {"code": "CUST-ANO-02", "name": "Anokhi Handcrafted Textiles", "type": "Boutique", "cp": "Pritam Singh", "email": "buying@anokhi.com", "phone": "+91 98290 22222", "city": "Jaipur", "credit": 2500000.0, "gst": "08AAACA5678B1Z2"},
        {"code": "CUST-NAL-03", "name": "Nalli Silk Sarees Enterprise", "type": "Retail Chain", "cp": "Ramanathan Chetty", "email": "silks@nalli.com", "phone": "+91 98400 33333", "city": "Chennai", "credit": 10000000.0, "gst": "33AAACN9012C1Z3"},
        {"code": "CUST-RMG-04", "name": "Raw Mango Contemporary Luxury", "type": "Boutique", "cp": "Sanjay Garg Studio", "email": "studio@rawmango.com", "phone": "+91 98101 44444", "city": "New Delhi", "credit": 3500000.0, "gst": "07AAACR3456D1Z4"},
        {"code": "CUST-RAY-05", "name": "Raymond Ethnic Wear Division", "cp": "Vikram Singhania", "email": "ethnic.sourcing@raymond.in", "phone": "+91 98200 55555", "city": "Mumbai", "credit": 8000000.0, "gst": "27AAACR7890E1Z5"},
        {"code": "CUST-KLA-06", "name": "Kalanjali Arts & Crafts", "cp": "Ramoji Rao", "email": "store@kalanjali.com", "phone": "+91 98490 66666", "city": "Hyderabad", "credit": 4000000.0, "gst": "36AAACK1122F1Z6"},
        {"code": "CUST-SAR-07", "name": "Suta Lifestyle Apparel", "cp": "Sujata Biswas", "email": "hello@suta.co.in", "phone": "+91 98210 77777", "city": "Mumbai", "credit": 1500000.0, "gst": "27AAACS3344G1Z7"},
        {"code": "CUST-LON-08", "name": "London Ethnic Silks UK", "type": "Exporter", "cp": "Alistair Campbell", "email": "imports@londonethnics.co.uk", "phone": "+44 20 7946 0991", "city": "London", "credit": 12000000.0, "gst": "99AAAAL9988H1Z8"},
        {"code": "CUST-BLR-09", "name": "The Registry of Sarees", "type": "Boutique", "cp": "Ahalya S", "email": "curation@registryofsarees.com", "phone": "+91 98450 88888", "city": "Bengaluru", "credit": 2000000.0, "gst": "29AAACT5566I1Z9"},
        {"code": "CUST-KOC-10", "name": "Kasavu Heritage Kerala", "type": "Wholesaler", "cp": "Unnikrishnan P", "email": "orders@kasavuheritage.com", "phone": "+91 94470 99999", "city": "Kochi", "credit": 3000000.0, "gst": "32AAACK7788J1Z0"},
        {"code": "CUST-USA-11", "name": "Diaspora Silks & Linen USA", "type": "Exporter", "cp": "Meera Swaminathan", "email": "meera@diasporasilks.com", "phone": "+1 415 555 2671", "city": "San Francisco", "credit": 15000000.0, "gst": "99AAAAD1122K1Z1"}
    ]
    customer_objs = {}
    for c in customers_data:
        cs = Customer(customer_code=c["code"], name=c["name"], customer_type=c.get("type", "Boutique"), contact_person=c["cp"], email=c["email"], phone=c["phone"], city=c["city"], credit_limit=c["credit"], gst_number=c["gst"], status="ACTIVE")
        db.add(cs)
        db.flush()
        customer_objs[c["code"]] = cs

    # 11. WAREHOUSES (6 strategic hubs)
    print("Seeding Warehouses...")
    warehouses_data = [
        {"code": "WH-ERD-01", "name": "Erode Central Raw Cotton Depot", "plant": "PLANT-ERD", "loc": "Warehouse Bay A, Erode Cluster", "type": "RAW_MATERIAL", "sqft": 15000, "mgr": "Saravanan R", "phone": "+91 98421 11001"},
        {"code": "WH-ERD-02", "name": "Erode Finished Saree Vault", "plant": "PLANT-ERD", "loc": "Climate Vault 2, Erode Cluster", "type": "FINISHED_GOODS", "sqft": 8000, "mgr": "Karthik Rajan", "phone": "+91 98421 11002"},
        {"code": "WH-CBE-01", "name": "Coimbatore Yarn & Fiber Silo", "plant": "PLANT-CBE", "loc": "Sector 4, Avinashi Road Unit", "type": "RAW_MATERIAL", "sqft": 12000, "mgr": "Sundaramurthy V", "phone": "+91 94432 44001"},
        {"code": "WH-TPR-01", "name": "Tiruppur Dyes & Mordant Store", "plant": "PLANT-TPR", "loc": "Ventilated Chemical Bay 1", "type": "RAW_MATERIAL", "sqft": 6000, "mgr": "Anandhi Natarajan", "phone": "+91 98943 77001"},
        {"code": "WH-CHE-01", "name": "Chennai Distribution & Export Center", "plant": "PLANT-CHE", "loc": "Harbour Transit Complex, Chennai", "type": "FINISHED_GOODS", "sqft": 20000, "mgr": "Deepa Sundar", "phone": "+91 94440 99002"},
        {"code": "WH-ERD-03", "name": "Warp Beams & Work-In-Progress Bay", "plant": "PLANT-ERD", "loc": "Loom Floor Connector Bay 3", "type": "WIP", "sqft": 7500, "mgr": "Thangavelu P", "phone": "+91 98421 11003"}
    ]
    warehouse_objs = {}
    for w in warehouses_data:
        wh = Warehouse(code=w["code"], name=w["name"], plant_id=plant_objs[w["plant"]].id, location=w["loc"], warehouse_type=w["type"], capacity_sqft=w["sqft"], manager_name=w["mgr"], contact_phone=w["phone"], status="ACTIVE")
        db.add(wh)
        db.flush()
        warehouse_objs[w["code"]] = wh

    # 12. FABRIC MASTER (16 exquisite textiles)
    print("Seeding Fabric Master...")
    fabrics_data = [
        {"code": "FAB-MSLK-60", "name": "Kanchipuram 3-Ply Mulberry Silk", "type": "Pure Silk", "comp": "100% Filature Mulberry Silk", "gsm": 72, "w": 48.0, "uom": "MTR", "clr": "CLR-IND", "sup": "SUP-KNC-02", "img": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80"},
        {"code": "FAB-KHD-120", "name": "Organic Handspun Khadi Cotton 120s", "type": "Khadi Cotton", "comp": "100% Desi Organic Cotton", "gsm": 115, "w": 44.0, "uom": "MTR", "clr": "CLR-IVR", "sup": "SUP-KOL-08", "img": "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=500&auto=format&fit=crop&q=80"},
        {"code": "FAB-ERI-90", "name": "Assam Ahimsa Eri Wild Silk", "type": "Wild Silk", "comp": "100% Hand-Reeled Eri Silk", "gsm": 95, "w": 45.0, "uom": "MTR", "clr": "CLR-IVR", "sup": "SUP-BGL-05", "img": "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=500&auto=format&fit=crop&q=80"},
        {"code": "FAB-TUS-85", "name": "Raw Bhagalpur Tussar Ghicha", "type": "Tussar Silk", "comp": "80% Tussar Silk 20% Ghicha Silk", "gsm": 88, "w": 46.0, "uom": "MTR", "clr": "CLR-TUR", "sup": "SUP-BGL-05", "img": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=80"},
        {"code": "FAB-LIN-140", "name": "Handwoven Belgian Flax Linen Blend", "type": "Linen Blend", "comp": "60% Organic Linen 40% Combed Cotton", "gsm": 140, "w": 54.0, "uom": "MTR", "clr": "CLR-TEA", "sup": "SUP-TPR-04", "img": "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=500&auto=format&fit=crop&q=80"},
        {"code": "FAB-CHZ-75", "name": "Chanderi Cotton-Silk with Tested Zari", "type": "Cotton-Silk Blend", "comp": "70% Silk Warp 30% Fine Cotton Weft", "gsm": 68, "w": 45.0, "uom": "MTR", "clr": "CLR-MDR", "sup": "SUP-SUT-06", "img": "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&auto=format&fit=crop&q=80"},
        {"code": "FAB-CHT-130", "name": "Authentic Chettinad Coarse Cotton", "type": "Cotton Fabric", "comp": "100% Ring Spun 40s Cotton", "gsm": 135, "w": 48.0, "uom": "MTR", "clr": "CLR-MAR", "sup": "SUP-SLM-01", "img": "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=500&auto=format&fit=crop&q=80"},
        {"code": "FAB-POCH-80", "name": "Pochampally Double Ikat Silk", "type": "Pure Silk", "comp": "100% Degummed Mulberry Silk", "gsm": 82, "w": 46.0, "uom": "MTR", "clr": "CLR-PUR", "sup": "SUP-HYD-10", "img": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80"},
        {"code": "FAB-JMD-55", "name": "Fine Bengal Jamdani Muslin", "type": "Fine Muslin", "comp": "100% Extra Long Staple Cotton 100s", "gsm": 55, "w": 44.0, "uom": "MTR", "clr": "CLR-IVR", "sup": "SUP-KOL-08", "img": "https://images.unsplash.com/photo-1544441893-675973e31985?w=500&auto=format&fit=crop&q=80"},
        {"code": "FAB-MGL-90", "name": "Mangalagiri Nizam Border Pattu", "type": "Cotton-Silk", "comp": "80% Combed Cotton 20% Silk", "gsm": 90, "w": 46.0, "uom": "MTR", "clr": "CLR-EMR", "sup": "SUP-HYD-10", "img": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=80"},
        {"code": "FAB-BAN-110", "name": "Varanasi Katan Silk Brocade", "type": "Brocade Silk", "comp": "100% Twisted Katan Silk with Gold Zari", "gsm": 120, "w": 45.0, "uom": "MTR", "clr": "CLR-MAG", "sup": "SUP-VNS-11", "img": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80"},
        {"code": "FAB-SMB-85", "name": "Sambalpuri Tie-and-Dye Cotton", "type": "Handloom Cotton", "comp": "100% Handloom Cotton 60s", "gsm": 85, "w": 46.0, "uom": "MTR", "clr": "CLR-COR", "sup": "SUP-SLM-01", "img": "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=500&auto=format&fit=crop&q=80"},
        {"code": "FAB-MSH-70", "name": "Maheshwari Silk-Cotton Warp", "type": "Silk-Cotton", "comp": "50% Silk 50% Mercerized Cotton", "gsm": 70, "w": 45.0, "uom": "MTR", "clr": "CLR-MUS", "sup": "SUP-TPR-04", "img": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80"},
        {"code": "FAB-SND-100", "name": "Madurai Sungudi Tie-Dye Cotton", "type": "Cotton Fabric", "comp": "100% Fine Combed Cotton 80s", "gsm": 100, "w": 44.0, "uom": "MTR", "clr": "CLR-TRQ", "sup": "SUP-MDU-09", "img": "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=500&auto=format&fit=crop&q=80"},
        {"code": "FAB-ORG-65", "name": "Handwoven Silk Organza", "type": "Silk Organza", "comp": "100% Degummed High-Twist Silk", "gsm": 42, "w": 45.0, "uom": "MTR", "clr": "CLR-LAV", "sup": "SUP-KNC-02", "img": "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=500&auto=format&fit=crop&q=80"},
        {"code": "FAB-KTM-125", "name": "Erode Organic Cotton Shirting", "type": "Organic Cotton", "comp": "100% GOTS Certified Cotton", "gsm": 128, "w": 58.0, "uom": "MTR", "clr": "CLR-CHA", "sup": "SUP-ERD-03", "img": "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=500&auto=format&fit=crop&q=80"}
    ]
    fabric_objs = {}
    for f in fabrics_data:
        fb = Fabric(
            code=f["code"], name=f["name"], fabric_type=f["type"], composition=f["comp"],
            gsm=f["gsm"], width_inches=f["w"], uom_id=uom_objs[f["uom"]].id,
            colour_id=colour_objs[f["clr"]].id, supplier_id=supplier_objs[f["sup"]].id,
            image_url=None, status="ACTIVE"
        )
        db.add(fb)
        db.flush()
        fabric_objs[f["code"]] = fb

    # 13. YARNS (12 distinct yarn varieties)
    print("Seeding Yarn Master...")
    yarns_data = [
        {"code": "YRN-COT-60S", "name": "60s Ne Superfine Combed Cotton", "type": "Cotton Yarn", "cnt": "60s Ne", "comp": "100% Giza Long Staple Cotton", "clr": "CLR-IVR", "sup": "SUP-SLM-01", "stock": "IN_STOCK"},
        {"code": "YRN-COT-80S", "name": "80s Ne Ring Spun Cotton Hank", "type": "Cotton Yarn", "cnt": "80s Ne", "comp": "100% Suvin Indian Cotton", "clr": "CLR-IVR", "sup": "SUP-SLM-01", "stock": "IN_STOCK"},
        {"code": "YRN-SLK-120", "name": "2/120s Mulberry Spun Silk Yarn", "type": "Mulberry Silk", "cnt": "2/120s Nm", "comp": "100% High-Grade Spun Silk", "clr": "CLR-IND", "sup": "SUP-KNC-02", "stock": "IN_STOCK"},
        {"code": "YRN-SLK-FIL", "name": "20/22 Denier Raw Filature Silk", "type": "Raw Silk", "cnt": "20/22 D", "comp": "100% Karnataka Bivoltine Silk", "clr": "CLR-TUR", "sup": "SUP-KNC-02", "stock": "IN_STOCK"},
        {"code": "YRN-LIN-20S", "name": "20s Lea Natural Wet-Spun Linen", "type": "Linen Yarn", "cnt": "20s Lea", "comp": "100% Normandy Flax", "clr": "CLR-TEA", "sup": "SUP-TPR-04", "stock": "LOW_STOCK"},
        {"code": "YRN-ERI-50", "name": "1/50s Eri Ahimsa Wild Silk Reeled", "type": "Wild Silk", "cnt": "1/50s Nm", "comp": "100% Organic Eri Silk", "clr": "CLR-IVR", "sup": "SUP-BGL-05", "stock": "IN_STOCK"},
        {"code": "YRN-TUS-30", "name": "30s Tussar Ghicha Textured Yarn", "type": "Tussar Yarn", "cnt": "30s Nm", "comp": "100% Hand-Drawn Ghicha Tussar", "clr": "CLR-TUR", "sup": "SUP-BGL-05", "stock": "IN_STOCK"},
        {"code": "YRN-ZRI-GLD", "name": "Half-Fine Gold Electroplated Zari", "type": "Metallic Thread", "cnt": "240 Gauge", "comp": "Silver Coated Copper with 24K Gilt", "clr": "CLR-TUR", "sup": "SUP-SUT-06", "stock": "IN_STOCK"},
        {"code": "YRN-ZRI-SLV", "name": "Tested Pure Silver Zari Thread", "type": "Metallic Thread", "cnt": "260 Gauge", "comp": "Pure Silver Filament on Silk Core", "clr": "CLR-IVR", "sup": "SUP-SUT-06", "stock": "LOW_STOCK"},
        {"code": "YRN-IND-40", "name": "Natural Indigo Vat-Dyed Cotton Hank", "type": "Dyed Cotton", "cnt": "2/40s Ne", "comp": "100% Organic Indigo Dyed Cotton", "clr": "CLR-IND", "sup": "SUP-ERD-03", "stock": "IN_STOCK"},
        {"code": "YRN-MDR-40", "name": "Natural Madder Red Dyed Cotton Hank", "type": "Dyed Cotton", "cnt": "2/40s Ne", "comp": "100% Madder Dyed Combed Cotton", "clr": "CLR-MDR", "sup": "SUP-ERD-03", "stock": "IN_STOCK"},
        {"code": "YRN-VIS-40", "name": "40s Bright Viscose Filament Yarn", "type": "Viscose Yarn", "cnt": "40s Ne", "comp": "100% Wood Pulp Rayon", "clr": "CLR-PUR", "sup": "SUP-TPR-04", "stock": "OUT_OF_STOCK"}
    ]
    yarn_objs = {}
    for y in yarns_data:
        yr = Yarn(
            code=y["code"], name=y["name"], yarn_type=y["type"], count=y["cnt"],
            composition=y["comp"], colour_id=colour_objs[y["clr"]].id,
            uom_id=uom_objs["KGS"].id, supplier_id=supplier_objs[y["sup"]].id,
            stock_status=y["stock"], status="ACTIVE"
        )
        db.add(yr)
        db.flush()
        yarn_objs[y["code"]] = yr

    # 14. ARTISANS / WEAVERS (22 master craftspeople with skills and experience)
    print("Seeding 22 Artisans...")
    artisans_data = [
        {"code": "ART-001", "name": "Murugesan Palanivel", "phone": "+91 94421 11001", "loc": "Sirumugai, Coimbatore", "lvl": "MASTER_WEAVER", "spec": "Pure Kanchipuram Silk Weaving", "exp": 32, "dept": "WEAV", "join": "1994-04-10"},
        {"code": "ART-002", "name": "Rathnam Sengodan", "phone": "+91 94421 11002", "loc": "Chennimalai, Erode", "lvl": "MASTER_WEAVER", "spec": "Jacquard Card Punching & Weaving", "exp": 28, "dept": "WEAV", "join": "1998-07-15"},
        {"code": "ART-003", "name": "Lakshmi Narayani", "phone": "+91 94421 11003", "loc": "Kanchipuram Heritage Quarter", "lvl": "MASTER_WEAVER", "spec": "Korvai Contrast Temple Border", "exp": 24, "dept": "WEAV", "join": "2002-01-20"},
        {"code": "ART-004", "name": "Chinnasamy Gounder", "phone": "+91 94421 11004", "loc": "Bhavani, Erode", "lvl": "MASTER_WEAVER", "spec": "Traditional Pit Loom Cotton Rugs & Dhotis", "exp": 35, "dept": "WEAV", "join": "1991-03-05"},
        {"code": "ART-005", "name": "Dhanalakshmi V", "phone": "+91 94421 11005", "loc": "Pochampally, Nalgonda", "lvl": "SENIOR_ARTISAN", "spec": "Double Ikat Warp & Weft Tying", "exp": 18, "dept": "WEAV", "join": "2008-09-12"},
        {"code": "ART-006", "name": "Kumarasamy P", "phone": "+91 94421 11006", "loc": "Dharapuram, Tiruppur", "lvl": "SENIOR_ARTISAN", "spec": "Natural Indigo Fermentation & Dyeing", "exp": 21, "dept": "DYEP", "join": "2005-11-01"},
        {"code": "ART-007", "name": "Perumal Kannan", "phone": "+91 94421 11007", "loc": "Chettinad, Sivaganga", "lvl": "SENIOR_ARTISAN", "spec": "Chettinad Plaid Pattern Weaving", "exp": 19, "dept": "WEAV", "join": "2007-06-18"},
        {"code": "ART-008", "name": "Gomathi Sankar", "phone": "+91 94421 11008", "loc": "Madurai South", "lvl": "SENIOR_ARTISAN", "spec": "Sungudi Tie-Dye Dotting & Dyeing", "exp": 16, "dept": "DYEP", "join": "2010-02-14"},
        {"code": "ART-009", "name": "Veerappan Mani", "phone": "+91 94421 11009", "loc": "Salem Rural", "lvl": "SENIOR_ARTISAN", "spec": "Silk Warping & Sizing Preparatory", "exp": 22, "dept": "SPIN", "join": "2004-05-30"},
        {"code": "ART-010", "name": "Selvarani Muthu", "phone": "+91 94421 11010", "loc": "Chanderi, Ashoknagar", "lvl": "SENIOR_ARTISAN", "spec": "Chanderi Extra-Weft Gold Zari Buttas", "exp": 15, "dept": "WEAV", "join": "2011-08-22"},
        {"code": "ART-011", "name": "Anbalagan K", "phone": "+91 94421 11011", "loc": "Erode City", "lvl": "SENIOR_ARTISAN", "spec": "Loom Harness Setting & Reed Tuning", "exp": 20, "dept": "MAIN", "join": "2006-10-10"},
        {"code": "ART-012", "name": "Pachaiyappan R", "phone": "+91 94421 11012", "loc": "Kanchipuram", "lvl": "MASTER_WEAVER", "spec": "Pure Zari Brocade & Pallu Inlay", "exp": 30, "dept": "WEAV", "join": "1996-12-01"},
        {"code": "ART-013", "name": "Saraswathi Natarajan", "phone": "+91 94421 11013", "loc": "Mangalagiri, Guntur", "lvl": "SENIOR_ARTISAN", "spec": "Nizam Border Fine Cotton Weaving", "exp": 17, "dept": "WEAV", "join": "2009-04-05"},
        {"code": "ART-014", "name": "Narayanasamy G", "phone": "+91 94421 11014", "loc": "Sambalpur, Odisha", "lvl": "MASTER_WEAVER", "spec": "Bandha Tie-Dye Silk Ikat Saree", "exp": 27, "dept": "WEAV", "join": "1999-03-15"},
        {"code": "ART-015", "name": "Malliga Ramasamy", "phone": "+91 94421 11015", "loc": "Sirumugai, Coimbatore", "lvl": "SENIOR_ARTISAN", "spec": "Soft Silk Contemporary Weaving", "exp": 14, "dept": "WEAV", "join": "2012-07-01"},
        {"code": "ART-016", "name": "Govindarajulu B", "phone": "+91 94421 11016", "loc": "Coimbatore Rural", "lvl": "APPRENTICE", "spec": "Cotton Bobbin Winding & Creel Loading", "exp": 3, "dept": "SPIN", "join": "2023-01-15"},
        {"code": "ART-017", "name": "Kavitha Murugesan", "phone": "+91 94421 11017", "loc": "Chennimalai, Erode", "lvl": "APPRENTICE", "spec": "Handloom Weft Pirn Winding", "exp": 4, "dept": "WEAV", "join": "2022-06-10"},
        {"code": "ART-018", "name": "Shankarlingam P", "phone": "+91 94421 11018", "loc": "Varanasi Ghats", "lvl": "MASTER_WEAVER", "spec": "Banarasi Kadwa & Katan Brocade", "exp": 33, "dept": "WEAV", "join": "1993-02-18"},
        {"code": "ART-019", "name": "Parvathi Sundaram", "phone": "+91 94421 11019", "loc": "Santiniketan, Birbhum", "lvl": "SENIOR_ARTISAN", "spec": "Kantha Hand Embroidery over Tussar", "exp": 15, "dept": "WEAV", "join": "2011-10-05"},
        {"code": "ART-020", "name": "Sundara Pandian", "phone": "+91 94421 11020", "loc": "Tiruppur", "lvl": "APPRENTICE", "spec": "Hank Washing & Solar Drying", "exp": 2, "dept": "DYEP", "join": "2024-03-01"},
        {"code": "ART-021", "name": "Devaki Ammal", "phone": "+91 94421 11021", "loc": "Bhavani, Erode", "lvl": "SENIOR_ARTISAN", "spec": "Warp Thread Mending & Knotting", "exp": 20, "dept": "WEAV", "join": "2006-05-14"},
        {"code": "ART-022", "name": "Elango Kaliyaperumal", "phone": "+91 94421 11022", "loc": "Salem", "lvl": "APPRENTICE", "spec": "Frame Loom Shuttle Handling", "exp": 1, "dept": "WEAV", "join": "2025-01-10"}
    ]
    artisan_objs = {}
    for idx, a in enumerate(artisans_data):
        art = Artisan(
            artisan_code=a["code"], name=a["name"], phone=a["phone"], location=a["loc"],
            skill_level=a["lvl"], specialization=a["spec"], experience_years=a["exp"],
            department_id=dept_objs[a["dept"]].id, joining_date=a["join"], status="ACTIVE",
            profile_image_url=None
        )
        db.add(art)
        db.flush()
        artisan_objs[a["code"]] = art

    # 15. LOOMS (12 looms with status, capacity and assigned master artisans)
    print("Seeding Loom Master...")
    looms_data = [
        {"num": "LOOM-ERD-01", "type": "Traditional Pit Loom", "plant": "PLANT-ERD", "loc": "Weaving Shed Bay 1", "cap": 3.5, "w": 48.0, "art": "ART-001", "stat": "RUNNING", "inst": "2015-06-10", "maint": "2026-08-15"},
        {"num": "LOOM-ERD-02", "type": "Electronic Jacquard Loom", "plant": "PLANT-ERD", "loc": "Weaving Shed Bay 1", "cap": 6.0, "w": 52.0, "art": "ART-002", "stat": "RUNNING", "inst": "2018-02-20", "maint": "2026-08-20"},
        {"num": "LOOM-ERD-03", "type": "Korvai Saree Pit Loom", "plant": "PLANT-ERD", "loc": "Heritage Silk Bay 2", "cap": 2.5, "w": 48.0, "art": "ART-003", "stat": "RUNNING", "inst": "2012-09-05", "maint": "2026-07-10"},
        {"num": "LOOM-ERD-04", "type": "Wide Width Frame Loom", "plant": "PLANT-ERD", "loc": "Linen Shirting Floor", "cap": 7.0, "w": 60.0, "art": "ART-004", "stat": "IDLE", "inst": "2019-11-12", "maint": "2026-06-01"},
        {"num": "LOOM-ERD-05", "type": "Double Ikat Frame Loom", "plant": "PLANT-ERD", "loc": "Ikat Section Bay 3", "cap": 4.0, "w": 48.0, "art": "ART-005", "stat": "RUNNING", "inst": "2016-04-18", "maint": "2026-08-25"},
        {"num": "LOOM-ERD-06", "type": "Chettinad Box Loom", "plant": "PLANT-ERD", "loc": "Cotton Shed Bay 4", "cap": 5.0, "w": 50.0, "art": "ART-007", "stat": "RUNNING", "inst": "2014-08-22", "maint": "2026-08-05"},
        {"num": "LOOM-ERD-07", "type": "Extra-Weft Chanderi Loom", "plant": "PLANT-ERD", "loc": "Fine Zari Wing", "cap": 3.0, "w": 46.0, "art": "ART-010", "stat": "MAINTENANCE", "inst": "2017-01-30", "maint": "2026-09-02"},
        {"num": "LOOM-CBE-01", "name": "LOOM-CBE-01", "type": "Raised Handloom 54-inch", "plant": "PLANT-CBE", "loc": "Spinning & Sample Unit", "cap": 6.5, "w": 54.0, "art": "ART-011", "stat": "RUNNING", "inst": "2020-05-15", "maint": "2026-08-18"},
        {"num": "LOOM-CBE-02", "name": "LOOM-CBE-02", "type": "Sectional Warping Loom", "plant": "PLANT-CBE", "loc": "Warp Prep Facility", "cap": 12.0, "w": 72.0, "art": "ART-009", "stat": "RUNNING", "inst": "2019-03-10", "maint": "2026-07-28"},
        {"num": "LOOM-TPR-01", "name": "LOOM-TPR-01", "type": "Sample Swatch Handloom", "plant": "PLANT-TPR", "loc": "Dye Lab Prototype Wing", "cap": 2.0, "w": 36.0, "art": "ART-006", "stat": "IDLE", "inst": "2021-09-01", "maint": "2026-05-15"},
        {"num": "LOOM-ERD-08", "type": "Heavy Jacquard Brocade Loom", "plant": "PLANT-ERD", "loc": "Heritage Silk Bay 2", "cap": 2.0, "w": 48.0, "art": "ART-012", "stat": "RUNNING", "inst": "2013-10-14", "maint": "2026-08-30"},
        {"num": "LOOM-ERD-09", "type": "Mangalagiri Nizam Loom", "plant": "PLANT-ERD", "loc": "Fine Weave Sector", "cap": 4.5, "w": 46.0, "art": "ART-013", "stat": "INACTIVE", "inst": "2011-04-12", "maint": "2026-01-10"}
    ]
    loom_objs = {}
    for l in looms_data:
        lm = Loom(
            loom_number=l["num"], loom_type=l["type"], plant_id=plant_objs[l["plant"]].id,
            location=l["loc"], capacity_meters_per_day=l["cap"], width_inches=l["w"],
            assigned_artisan_id=artisan_objs[l["art"]].id if l["art"] else None,
            installation_date=l["inst"], last_maintenance_date=l["maint"], status=l["stat"]
        )
        db.add(lm)
        db.flush()
        loom_objs[l["num"]] = lm

    # 16. PRODUCTS (18 iconic handloom and textile products)
    print("Seeding Products Master...")
    products_data = [
        {"code": "PRD-KNC-01", "name": "Kanchipuram Pure Silk Wedding Saree", "cat": "Sarees", "type": "Heavy Silk Saree", "fab": "FAB-MSLK-60", "dsg": "DSG-TMP-01", "clr": "CLR-IND", "size": "6.25 Meters", "cost": 18500.0, "sell": 34999.0, "desc": "Woven with double warp 3-ply mulberry silk, featuring auspicious temple border and solid gold tested zari pallu.", "img": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80"},
        {"code": "PRD-CHN-02", "name": "Chanderi Cotton-Silk Floral Saree", "cat": "Sarees", "type": "Lightweight Saree", "fab": "FAB-CHZ-75", "dsg": "DSG-JAL-06", "clr": "CLR-MDR", "size": "6.25 Meters", "cost": 4200.0, "sell": 8450.0, "desc": "Airy sheer Chanderi weave adorned with delicate hand-woven silver zari floral jaal work.", "img": "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80"},
        {"code": "PRD-SMB-03", "name": "Sambalpuri Handloom Ikat Saree", "cat": "Sarees", "type": "Ikat Saree", "fab": "FAB-SMB-85", "dsg": "DSG-IKT-05", "clr": "CLR-COR", "size": "6.25 Meters", "cost": 3800.0, "sell": 7200.0, "desc": "Authentic Odisha bandha tie-and-dye cotton saree with geometric border motifs and rudraksha borders.", "img": "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600&auto=format&fit=crop&q=80"},
        {"code": "PRD-PCH-04", "name": "Pochampally Double Ikat Silk Dupatta", "cat": "Dupattas", "type": "Luxury Dupatta", "fab": "FAB-POCH-80", "dsg": "DSG-IKT-05", "clr": "CLR-PUR", "size": "2.5 Meters", "cost": 2900.0, "sell": 5999.0, "desc": "Precision geometric ikat chevron woven in bright contrast royal purple and turquoise silk.", "img": "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80"},
        {"code": "PRD-LIN-05", "name": "Handwoven Belgian Flax Linen Tunic Fabric", "cat": "Fabrics", "type": "Apparel Fabric", "fab": "FAB-LIN-140", "dsg": "DSG-PLN-12", "clr": "CLR-TEA", "size": "Per Meter", "cost": 650.0, "sell": 1350.0, "desc": "Breathable 140 GSM linen-cotton blend fabric with washed artisanal drape and slub texture.", "img": "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=600&auto=format&fit=crop&q=80"},
        {"code": "PRD-JMD-06", "name": "Jamdani Muslin Summer Stole", "cat": "Stoles", "type": "Artisanal Stole", "fab": "FAB-JMD-55", "dsg": "DSG-JMD-08", "clr": "CLR-IVR", "size": "2.0 Meters", "cost": 1800.0, "sell": 4200.0, "desc": "Ultra-fine handspun cotton stole woven with discontinuous weft floral vine motifs.", "img": "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=600&auto=format&fit=crop&q=80"},
        {"code": "PRD-BAN-07", "name": "Banarasi Katan Silk Brocade Yardage", "cat": "Fabrics", "type": "Brocade Fabric", "fab": "FAB-BAN-110", "dsg": "DSG-SHI-11", "clr": "CLR-MAG", "size": "Per Meter", "cost": 2200.0, "sell": 4800.0, "desc": "Opulent pure katan silk woven with rich gold and silver zari in traditional hunting forest narrative.", "img": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80"},
        {"code": "PRD-TUS-08", "name": "Raw Tussar Silk Kantha Embroidered Stole", "cat": "Stoles", "type": "Embroidered Stole", "fab": "FAB-TUS-85", "dsg": "DSG-PSY-02", "clr": "CLR-TUR", "size": "2.2 Meters", "cost": 2400.0, "sell": 5400.0, "desc": "Naturally textured wild tussar silk embellished with artisanal hand Kantha embroidery.", "img": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80"},
        {"code": "PRD-KHD-09", "name": "Handspun Khadi Indigo Shirting Yardage", "cat": "Fabrics", "type": "Shirting Fabric", "fab": "FAB-KHD-120", "dsg": "DSG-STR-10", "clr": "CLR-IND", "size": "Per Meter", "cost": 380.0, "sell": 890.0, "desc": "100% natural indigo fermented handspun cotton shirting with micro dobby warp stripe.", "img": "https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80"},
        {"code": "PRD-MSH-10", "name": "Maheshwari Silk-Cotton Reversible Dupatta", "cat": "Dupattas", "type": "Reversible Dupatta", "fab": "FAB-MSH-70", "dsg": "DSG-RUD-03", "clr": "CLR-MUS", "size": "2.5 Meters", "cost": 1650.0, "sell": 3499.0, "desc": "Classic Maheshwari border with reversible woven bands in warm golden mustard and red.", "img": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80"},
        {"code": "PRD-CHT-11", "name": "Chettinad Heritage Check Cotton Saree", "cat": "Sarees", "type": "Traditional Cotton", "fab": "FAB-CHT-130", "dsg": "DSG-CHK-07", "clr": "CLR-MAR", "size": "6.0 Meters", "cost": 1400.0, "sell": 2999.0, "desc": "Durable handloom cotton saree in bold contrast windowpane checks and heavy temple border.", "img": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80"},
        {"code": "PRD-MGL-12", "name": "Mangalagiri Nizam Gold Border Saree", "cat": "Sarees", "type": "Pattu Saree", "fab": "FAB-MGL-90", "dsg": "DSG-TMP-01", "clr": "CLR-EMR", "size": "6.25 Meters", "cost": 2100.0, "sell": 4650.0, "desc": "Lustrous emerald body with fine gold zari Nizam temple border woven on Andhra pit looms.", "img": "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=600&auto=format&fit=crop&q=80"},
        {"code": "PRD-ERI-13", "name": "Ahimsa Wild Silk Unisex Shawl", "cat": "Shawls", "type": "Warm Silk Shawl", "fab": "FAB-ERI-90", "dsg": "DSG-PLN-12", "clr": "CLR-IVR", "size": "1.2m x 2.4m", "cost": 3200.0, "sell": 6999.0, "desc": "Non-violent thermal wild Eri silk shawl with hand-twisted fringes, soft thermal insulation.", "img": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80"},
        {"code": "PRD-SND-14", "name": "Madurai Sungudi Tie-Dye Saree", "cat": "Sarees", "type": "Sungudi Saree", "fab": "FAB-SND-100", "dsg": "DSG-MAY-04", "clr": "CLR-TRQ", "size": "6.0 Meters", "cost": 1250.0, "sell": 2699.0, "desc": "Hand-tied sungudi knot micro-dots with radiant peacock motif pallu in peacock turquoise.", "img": "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80"},
        {"code": "PRD-ORG-15", "name": "Pastel Silk Organza Hand-Painted Dupatta", "cat": "Dupattas", "type": "Luxury Organza", "fab": "FAB-ORG-65", "dsg": "DSG-ANX-09", "clr": "CLR-LAV", "size": "2.5 Meters", "cost": 2750.0, "sell": 6200.0, "desc": "Sheer glass-finish silk organza with delicate hand-painted botanical motifs and zari piping.", "img": "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600&auto=format&fit=crop&q=80"},
        {"code": "PRD-THW-16", "name": "Handwoven Organic Cotton Textured Throw", "cat": "Home Linen", "type": "Living Throw", "fab": "FAB-KTM-125", "dsg": "DSG-PLN-12", "clr": "CLR-CHA", "size": "1.5m x 2.0m", "cost": 1100.0, "sell": 2450.0, "desc": "Chunky handwoven waffle-weave throw made from unbleached and charcoal organic cotton.", "img": "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=600&auto=format&fit=crop&q=80"},
        {"code": "PRD-KNC-17", "name": "Bridal Korvai Peacock Silk Saree", "cat": "Sarees", "type": "Bridal Silk Saree", "fab": "FAB-MSLK-60", "dsg": "DSG-MAY-04", "clr": "CLR-MDR", "size": "6.25 Meters", "cost": 22000.0, "sell": 42000.0, "desc": "Interlocking weft Korvai technique uniting deep madder body with jewel emerald dancing peacock border.", "img": "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80"},
        {"code": "PRD-KUR-18", "name": "Bhagalpuri Silk Tunic Yardage", "cat": "Fabrics", "type": "Apparel Yardage", "fab": "FAB-TUS-85", "dsg": "DSG-PSY-02", "clr": "CLR-TUR", "size": "Per Meter", "cost": 750.0, "sell": 1600.0, "desc": "Matte finish tussar silk yardage suited for festive kurtas and jackets with micro butta weave.", "img": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80"}
    ]
    product_objs = {}
    for p in products_data:
        pr = Product(
            code=p["code"], name=p["name"], category=p["cat"], product_type=p["type"],
            fabric_id=fabric_objs[p["fab"]].id, design_id=design_objs[p["dsg"]].id,
            colour_id=colour_objs[p["clr"]].id, size=p["size"], uom_id=uom_objs["PCS" if "Saree" in p["cat"] or "Dupatta" in p["cat"] or "Stole" in p["cat"] or "Shawl" in p["cat"] or "Linen" in p["cat"] else "MTR"].id,
            cost_price=p["cost"], selling_price=p["sell"], description=p["desc"],
            status="ACTIVE", image_url=None
        )
        db.add(pr)
        db.flush()
        product_objs[p["code"]] = pr

    # 17. OPERATIONS SAMPLE RECORDS
    print("Seeding Operational Modules (Production, Inventory, Purchase, Sales, Quality)...")
    # Production Orders
    po1 = ProductionOrder(
        order_number="PROD-2026-001", product_id=product_objs["PRD-KNC-01"].id,
        loom_id=loom_objs["LOOM-ERD-01"].id, artisan_id=artisan_objs["ART-001"].id,
        target_quantity=10, completed_quantity=7, start_date="2026-08-01",
        target_end_date="2026-09-20", status="IN_PROGRESS", notes="Rush order for Nalli Silk wedding collection"
    )
    po2 = ProductionOrder(
        order_number="PROD-2026-002", product_id=product_objs["PRD-CHN-02"].id,
        loom_id=loom_objs["LOOM-ERD-02"].id, artisan_id=artisan_objs["ART-002"].id,
        target_quantity=25, completed_quantity=18, start_date="2026-08-10",
        target_end_date="2026-09-30", status="IN_PROGRESS", notes="Festive export to FabIndia"
    )
    po3 = ProductionOrder(
        order_number="PROD-2026-003", product_id=product_objs["PRD-SMB-03"].id,
        loom_id=loom_objs["LOOM-ERD-05"].id, artisan_id=artisan_objs["ART-005"].id,
        target_quantity=15, completed_quantity=15, start_date="2026-07-01",
        target_end_date="2026-08-15", status="COMPLETED", notes="Batch completed with 100% A-grade certification"
    )
    db.add_all([po1, po2, po3])

    # Inventory Items
    inv1 = InventoryItem(item_code="INV-RAW-001", item_name="2/120s Mulberry Spun Silk Cones", category="RAW_MATERIAL", warehouse_id=warehouse_objs["WH-ERD-01"].id, quantity_on_hand=340.5, min_reorder_level=50.0, unit_of_measure="KGS", batch_number="BATCH-SLK-88", status="AVAILABLE")
    inv2 = InventoryItem(item_code="INV-RAW-002", item_name="Natural Indigo Dye Powder (Cakes)", category="RAW_MATERIAL", warehouse_id=warehouse_objs["WH-TPR-01"].id, quantity_on_hand=82.0, min_reorder_level=25.0, unit_of_measure="KGS", batch_number="BATCH-IND-12", status="AVAILABLE")
    inv3 = InventoryItem(item_code="INV-FIN-001", item_name="Kanchipuram Silk Sarees (Finished Vault)", category="FINISHED_GOODS", warehouse_id=warehouse_objs["WH-ERD-02"].id, quantity_on_hand=48.0, min_reorder_level=10.0, unit_of_measure="Pieces", batch_number="BATCH-FIN-09", status="AVAILABLE")
    inv4 = InventoryItem(item_code="INV-WIP-001", item_name="Warp Beams 60s Organic Cotton (Dressed)", category="WIP", warehouse_id=warehouse_objs["WH-ERD-03"].id, quantity_on_hand=12.0, min_reorder_level=5.0, unit_of_measure="Pieces", batch_number="WIP-WRP-44", status="AVAILABLE")
    db.add_all([inv1, inv2, inv3, inv4])

    # Purchase Orders
    pur1 = PurchaseOrder(po_number="PO-2026-089", supplier_id=supplier_objs["SUP-KNC-02"].id, total_amount=485000.0, order_date="2026-08-15", expected_delivery_date="2026-09-05", status="RECEIVED")
    pur2 = PurchaseOrder(po_number="PO-2026-094", supplier_id=supplier_objs["SUP-SLM-01"].id, total_amount=215000.0, order_date="2026-09-01", expected_delivery_date="2026-09-18", status="PENDING_RECEIPT")
    db.add_all([pur1, pur2])

    # Sales Orders
    so1 = SalesOrder(so_number="SO-2026-401", customer_id=customer_objs["CUST-NAL-03"].id, total_amount=1250000.0, order_date="2026-08-20", dispatch_date="2026-09-10", status="PROCESSING")
    so2 = SalesOrder(so_number="SO-2026-402", customer_id=customer_objs["CUST-FAB-01"].id, total_amount=890000.0, order_date="2026-08-28", dispatch_date="2026-09-15", status="DISPATCHED")
    db.add_all([so1, so2])

    # Quality Inspections
    qi1 = QualityInspection(inspection_number="QC-INSP-101", product_id=product_objs["PRD-KNC-01"].id, inspector_name="Meena Sundaram", fabric_grade="A_GRADE", defects_found="None. High tensile strength, warp uniform.", inspection_date="2026-09-02", status="PASSED")
    qi2 = QualityInspection(inspection_number="QC-INSP-102", product_id=product_objs["PRD-LIN-05"].id, inspector_name="Shanthi Ramesh", fabric_grade="A_GRADE", defects_found="Even slub count, GSM verified at 141.", inspection_date="2026-09-05", status="PASSED")
    db.add_all([qi1, qi2])

    # 18. USER APPROVALS (Realistic pending and approved requests)
    print("Seeding User Approvals workflow...")
    appr1 = UserApproval(
        user_id=user_objs["EMP-1022"].id,
        requested_role_id=role_objs["WEAVER_OP"].id,
        requested_plant_id=plant_objs["PLANT-ERD"].id,
        requested_by="Priya Devi (HR Director)",
        status="PENDING",
        decision_notes="Candidate completed 6-month apprentice certification under Master Murugesan.",
        created_at=datetime.now(timezone.utc) - timedelta(days=2)
    )
    appr2 = UserApproval(
        user_id=user_objs["EMP-1004"].id,
        requested_role_id=role_objs["PROD_SUPERVISOR"].id,
        requested_plant_id=plant_objs["PLANT-ERD"].id,
        requested_by="Arun Kumar (Production Manager)",
        status="APPROVED",
        decision_notes="Approved promotion to Weaving Floor Supervisor.",
        decided_by="Super Administrator",
        decided_at=datetime.now(timezone.utc) - timedelta(days=10),
        created_at=datetime.now(timezone.utc) - timedelta(days=12)
    )
    db.add_all([appr1, appr2])

    # 19. AUDIT LOGS (25+ realistic operational records)
    print("Seeding System Audit Logs...")
    audit_events = [
        ("AUTH", "LOGIN", "Super Administrator logged in from IP 192.168.1.10", "Super Admin", user_objs["EMP-1001"].id, "SYS-01", "Admin Login"),
        ("USERS", "CREATE", "HR Manager created user profile for Arun Kumar (EMP-1002)", "Priya Devi", user_objs["EMP-1003"].id, user_objs["EMP-1002"].id, "Arun Kumar"),
        ("USERS", "UPDATE", "Admin updated plant assignments for Karthik Raj (EMP-1004)", "Super Admin", user_objs["EMP-1001"].id, user_objs["EMP-1004"].id, "Karthik Raj"),
        ("ROLES", "UPDATE", "HR Manager updated permission matrix for Production Supervisor", "Priya Devi", user_objs["EMP-1003"].id, role_objs["PROD_SUPERVISOR"].id, "Production Supervisor"),
        ("FABRICS", "CREATE", "Admin added master fabric Kanchipuram 3-Ply Mulberry Silk (FAB-MSLK-60)", "Super Admin", user_objs["EMP-1001"].id, fabric_objs["FAB-MSLK-60"].id, "Kanchipuram Silk"),
        ("YARNS", "CREATE", "Procurement Manager added 60s Ne Superfine Combed Cotton (YRN-COT-60S)", "Manickam Chettiar", user_objs["EMP-1007"].id, yarn_objs["YRN-COT-60S"].id, "60s Ne Cotton"),
        ("COLOURS", "CREATE", "Dye Specialist configured new master colour 'Deep Royal Indigo' (#1C3F60)", "Murugan Velu", user_objs["EMP-1010"].id, colour_objs["CLR-IND"].id, "Deep Royal Indigo"),
        ("DESIGNS", "CREATE", "Textile Designer archived new design 'Gopuram Temple Spire Border'", "Priya Darshini", user_objs["EMP-1012"].id, design_objs["DSG-TMP-01"].id, "Temple Spire"),
        ("LOOMS", "UPDATE", "Technician Thangavelu scheduled periodic maintenance for LOOM-ERD-01", "Thangavelu Periyasamy", user_objs["EMP-1013"].id, loom_objs["LOOM-ERD-01"].id, "LOOM-ERD-01"),
        ("LOOMS", "STATUS_CHANGE", "Supervisor changed LOOM-ERD-07 status to MAINTENANCE due to harness tuning", "Karthik Raj", user_objs["EMP-1004"].id, loom_objs["LOOM-ERD-07"].id, "LOOM-ERD-07"),
        ("ARTISANS", "CREATE", "Registered Master Weaver Murugesan Palanivel (ART-001) with 32 yrs exp", "Priya Devi", user_objs["EMP-1003"].id, artisan_objs["ART-001"].id, "Murugesan P"),
        ("SUPPLIERS", "CREATE", "Added Kanchipuram Silk Co-operative Federation (SUP-KNC-02)", "Manickam Chettiar", user_objs["EMP-1007"].id, supplier_objs["SUP-KNC-02"].id, "Kanchi Silk Fed"),
        ("CUSTOMERS", "CREATE", "Onboarded FabIndia Heritage Retails Ltd with 50 Lakh credit limit", "Deepa Sundar", user_objs["EMP-1008"].id, customer_objs["CUST-FAB-01"].id, "FabIndia"),
        ("PRODUCTS", "CREATE", "Created Product Master entry: Kanchipuram Pure Silk Wedding Saree", "Super Admin", user_objs["EMP-1001"].id, product_objs["PRD-KNC-01"].id, "Kanchipuram Silk Saree"),
        ("PRODUCTION", "CREATE", "Generated production batch PROD-2026-001 on LOOM-ERD-01", "Arun Kumar", user_objs["EMP-1002"].id, po1.id, "PROD-2026-001"),
        ("QUALITY", "PASS", "Inspection QC-INSP-101 passed with A_GRADE certification", "Meena Sundaram", user_objs["EMP-1005"].id, qi1.id, "QC-INSP-101"),
        ("DEPARTMENTS", "CREATE", "Configured Department 'Handloom Weaving' linked to Erode Plant", "Super Admin", user_objs["EMP-1001"].id, dept_objs["WEAV"].id, "Weaving Dept"),
        ("PLANTS", "CREATE", "Initialized plant unit 'Erode Weaving Cluster' (PLANT-ERD)", "Super Admin", user_objs["EMP-1001"].id, plant_objs["PLANT-ERD"].id, "Erode Plant"),
        ("INVENTORY", "UPDATE", "Logged stock arrival of 340.5 Kgs Spun Silk in Central Depot", "Saravanan Ramasamy", user_objs["EMP-1006"].id, inv1.id, "Stock Inward"),
        ("USER_APPROVALS", "APPROVE", "Super Admin approved supervisor request for Karthik Raj", "Super Admin", user_objs["EMP-1001"].id, appr2.id, "Karthik Raj Approval")
    ]
    for idx, ev in enumerate(audit_events):
        log = AuditLog(
            module=ev[0], action=ev[1], description=ev[2],
            user_name=ev[3], user_id=ev[4], record_id=str(ev[5]),
            record_title=ev[6], status="SUCCESS",
            created_at=datetime.now(timezone.utc) - timedelta(hours=idx*4 + 2)
        )
        db.add(log)

    # 20. LOGIN ACTIVITIES
    print("Seeding Login Activity History...")
    login_events = [
        ("admin@loomora.com", user_objs["EMP-1001"].id, "192.168.1.10", "Desktop (Windows 11)", "Chrome 128.0", "SUCCESS", None, 1),
        ("arun.kumar@loomora.com", user_objs["EMP-1002"].id, "192.168.1.15", "Laptop (macOS)", "Safari 17.5", "SUCCESS", None, 3),
        ("priya.devi@loomora.com", user_objs["EMP-1003"].id, "192.168.1.22", "Desktop (Windows 11)", "Edge 128.0", "SUCCESS", None, 5),
        ("meena.s@loomora.com", user_objs["EMP-1005"].id, "192.168.2.45", "Tablet (iPadOS)", "Mobile Safari", "SUCCESS", None, 8),
        ("saravanan.r@loomora.com", user_objs["EMP-1006"].id, "192.168.2.50", "Desktop (Windows 10)", "Chrome 128.0", "SUCCESS", None, 12),
        ("unknown.guest@textile.in", None, "49.207.180.12", "Mobile (Android)", "Chrome Mobile", "FAILED", "User not found in system", 14),
        ("karthik.raj@loomora.com", user_objs["EMP-1004"].id, "192.168.1.88", "Mobile (Android)", "Firefox 129.0", "SUCCESS", None, 16),
        ("deepa.sundar@loomora.com", user_objs["EMP-1008"].id, "192.168.3.10", "Laptop (macOS)", "Chrome 128.0", "SUCCESS", None, 20),
        ("admin@loomora.com", user_objs["EMP-1001"].id, "192.168.1.10", "Desktop (Windows 11)", "Chrome 128.0", "FAILED", "Password mismatch", 24),
        ("admin@loomora.com", user_objs["EMP-1001"].id, "192.168.1.10", "Desktop (Windows 11)", "Chrome 128.0", "SUCCESS", None, 24)
    ]
    for le in login_events:
        la = LoginActivity(
            email=le[0], user_id=le[1], ip_address=le[2],
            device=le[3], browser=le[4], status=le[5], failure_reason=le[6],
            login_time=datetime.now(timezone.utc) - timedelta(hours=le[7])
        )
        db.add(la)

    db.commit()
    db.close()
    print("LOOMORA ERP Seed Completed Successfully! 100% database populated.")

if __name__ == "__main__":
    seed()

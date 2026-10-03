from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.user import User
from app.models.master_data import (
    Product, Fabric, Yarn, Artisan, Supplier, Customer, Loom
)
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/search", tags=["Global Search"])

@router.get("")
def global_search(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query_str = f"%{q.strip()}%"
    results = {}

    # Users
    users = (
        db.query(User)
        .filter(
            or_(
                User.first_name.ilike(query_str),
                User.last_name.ilike(query_str),
                User.email.ilike(query_str),
                User.employee_id.ilike(query_str)
            )
        )
        .limit(5)
        .all()
    )
    if users:
        results["users"] = [
            {
                "id": u.id,
                "title": u.full_name,
                "subtitle": f"{u.employee_id} • {u.role.name if u.role else 'User'}",
                "route": f"/users/{u.id}"
            }
            for u in users
        ]

    # Products
    products = (
        db.query(Product)
        .filter(or_(Product.name.ilike(query_str), Product.code.ilike(query_str), Product.category.ilike(query_str)))
        .limit(5)
        .all()
    )
    if products:
        results["products"] = [
            {
                "id": p.id,
                "title": p.name,
                "subtitle": f"{p.code} • {p.category} • ₹{p.selling_price:,.0f}",
                "route": "/products"
            }
            for p in products
        ]

    # Fabrics
    fabrics = (
        db.query(Fabric)
        .filter(or_(Fabric.name.ilike(query_str), Fabric.code.ilike(query_str), Fabric.composition.ilike(query_str)))
        .limit(5)
        .all()
    )
    if fabrics:
        results["fabrics"] = [
            {
                "id": f.id,
                "title": f.name,
                "subtitle": f"{f.code} • {f.composition} • {f.gsm or ''} GSM",
                "route": "/fabrics"
            }
            for f in fabrics
        ]

    # Yarns
    yarns = (
        db.query(Yarn)
        .filter(or_(Yarn.name.ilike(query_str), Yarn.code.ilike(query_str), Yarn.count.ilike(query_str)))
        .limit(5)
        .all()
    )
    if yarns:
        results["yarns"] = [
            {
                "id": y.id,
                "title": y.name,
                "subtitle": f"{y.code} • Count {y.count} • {y.stock_status}",
                "route": "/yarns"
            }
            for y in yarns
        ]

    # Artisans
    artisans = (
        db.query(Artisan)
        .filter(or_(Artisan.name.ilike(query_str), Artisan.artisan_code.ilike(query_str), Artisan.specialization.ilike(query_str)))
        .limit(5)
        .all()
    )
    if artisans:
        results["artisans"] = [
            {
                "id": a.id,
                "title": a.name,
                "subtitle": f"{a.artisan_code} • {a.specialization} ({a.experience_years} yrs)",
                "route": "/artisans"
            }
            for a in artisans
        ]

    # Suppliers
    suppliers = (
        db.query(Supplier)
        .filter(or_(Supplier.name.ilike(query_str), Supplier.supplier_code.ilike(query_str), Supplier.city.ilike(query_str)))
        .limit(5)
        .all()
    )
    if suppliers:
        results["suppliers"] = [
            {
                "id": s.id,
                "title": s.name,
                "subtitle": f"{s.supplier_code} • {s.city or ''} • {s.materials_supplied or ''}",
                "route": "/suppliers"
            }
            for s in suppliers
        ]

    # Customers
    customers = (
        db.query(Customer)
        .filter(or_(Customer.name.ilike(query_str), Customer.customer_code.ilike(query_str), Customer.city.ilike(query_str)))
        .limit(5)
        .all()
    )
    if customers:
        results["customers"] = [
            {
                "id": c.id,
                "title": c.name,
                "subtitle": f"{c.customer_code} • {c.customer_type or 'Customer'}",
                "route": "/customers"
            }
            for c in customers
        ]

    # Looms
    looms = (
        db.query(Loom)
        .filter(or_(Loom.loom_number.ilike(query_str), Loom.loom_type.ilike(query_str), Loom.location.ilike(query_str)))
        .limit(5)
        .all()
    )
    if looms:
        results["looms"] = [
            {
                "id": l.id,
                "title": f"Loom {l.loom_number}",
                "subtitle": f"{l.loom_type} • Status: {l.status}",
                "route": "/looms"
            }
            for l in looms
        ]

    return {
        "query": q,
        "results": results,
        "total_matches": sum(len(v) for v in results.values())
    }

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
import app.models  # Ensure models are loaded
from app.routers import (
    auth_router,
    users_router,
    roles_router,
    departments_router,
    plants_router,
    user_approvals_router,
    login_activity_router,
    audit_logs_router,
    uom_router,
    tax_rates_router,
    colours_router,
    designs_router,
    suppliers_router,
    customers_router,
    warehouses_router,
    fabrics_router,
    yarns_router,
    products_router,
    artisans_router,
    looms_router,
    operations_router,
    dashboard_router,
    search_router,
    reports_router,
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=f"{settings.PROJECT_SUBTITLE} — Production Enterprise API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local ERP development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
        print("Database schema verified / initialized successfully.")
    except Exception as e:
        print(f"Warning on startup table creation: {e}")

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "subtitle": settings.PROJECT_SUBTITLE,
        "status": "online",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": "OK",
        "database": "connected"
    }

# Mount modular routers under API prefix
api_prefix = settings.API_V1_STR

app.include_router(auth_router, prefix=api_prefix)
app.include_router(users_router, prefix=api_prefix)
app.include_router(roles_router, prefix=api_prefix)
app.include_router(departments_router, prefix=api_prefix)
app.include_router(plants_router, prefix=api_prefix)
app.include_router(user_approvals_router, prefix=api_prefix)
app.include_router(login_activity_router, prefix=api_prefix)
app.include_router(audit_logs_router, prefix=api_prefix)

# Master Data Routers
app.include_router(uom_router, prefix=api_prefix)
app.include_router(tax_rates_router, prefix=api_prefix)
app.include_router(colours_router, prefix=api_prefix)
app.include_router(designs_router, prefix=api_prefix)
app.include_router(suppliers_router, prefix=api_prefix)
app.include_router(customers_router, prefix=api_prefix)
app.include_router(warehouses_router, prefix=api_prefix)
app.include_router(fabrics_router, prefix=api_prefix)
app.include_router(yarns_router, prefix=api_prefix)
app.include_router(products_router, prefix=api_prefix)
app.include_router(artisans_router, prefix=api_prefix)
app.include_router(looms_router, prefix=api_prefix)

# Operational & Analytics Routers
app.include_router(operations_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)
app.include_router(search_router, prefix=api_prefix)
app.include_router(reports_router, prefix=api_prefix)

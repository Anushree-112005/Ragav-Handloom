from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.roles import router as roles_router
from app.routers.departments import router as departments_router
from app.routers.plants import router as plants_router
from app.routers.user_approvals import router as user_approvals_router
from app.routers.login_activity import router as login_activity_router
from app.routers.audit_logs import router as audit_logs_router
from app.routers.uom import router as uom_router
from app.routers.tax_rates import router as tax_rates_router
from app.routers.colours import router as colours_router
from app.routers.designs import router as designs_router
from app.routers.suppliers import router as suppliers_router
from app.routers.customers import router as customers_router
from app.routers.warehouses import router as warehouses_router
from app.routers.fabrics import router as fabrics_router
from app.routers.yarns import router as yarns_router
from app.routers.products import router as products_router
from app.routers.artisans import router as artisans_router
from app.routers.looms import router as looms_router
from app.routers.operations import router as operations_router
from app.routers.dashboard import router as dashboard_router
from app.routers.search import router as search_router
from app.routers.reports import router as reports_router

__all__ = [
    "auth_router",
    "users_router",
    "roles_router",
    "departments_router",
    "plants_router",
    "user_approvals_router",
    "login_activity_router",
    "audit_logs_router",
    "uom_router",
    "tax_rates_router",
    "colours_router",
    "designs_router",
    "suppliers_router",
    "customers_router",
    "warehouses_router",
    "fabrics_router",
    "yarns_router",
    "products_router",
    "artisans_router",
    "looms_router",
    "operations_router",
    "dashboard_router",
    "search_router",
    "reports_router",
]

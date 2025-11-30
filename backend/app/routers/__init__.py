from .auth import router as auth_router
from .employees import router as employees_router
from .visits import router as visits_router
from .sales import router as sales_router
from .cases import router as cases_router
from .goals import router as goals_router
from .reports import router as reports_router
from .dashboard import router as dashboard_router
from .feedbacks import router as feedbacks_router

__all__ = [
    "auth_router",
    "employees_router",
    "visits_router",
    "sales_router",
    "cases_router",
    "goals_router",
    "reports_router",
    "dashboard_router",
    "feedbacks_router",
]

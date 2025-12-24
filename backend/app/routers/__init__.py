from .auth import router as auth_router
from .employees import router as employees_router
from .sales import router as sales_router
from .goals import router as goals_router
from .reports import router as reports_router
from .dashboard import router as dashboard_router
from .weekly_programs import router as weekly_programs_router
from .status_reports import router as status_reports_router
from .pharmacies import router as pharmacies_router
from .daily_visits import router as daily_visits_router
from .settings import router as settings_router
from .leave_types import router as leave_types_router
from .leave_requests import router as leave_requests_router
from .annual_leave_rules import router as annual_leave_rules_router

__all__ = [
    "auth_router",
    "employees_router",
    "sales_router",
    "goals_router",
    "reports_router",
    "dashboard_router",
    "weekly_programs_router",
    "status_reports_router",
    "pharmacies_router",
    "daily_visits_router",
    "settings_router",
    "leave_types_router",
    "leave_requests_router",
    "annual_leave_rules_router",
]

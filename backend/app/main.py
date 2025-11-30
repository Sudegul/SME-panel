from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import (
    auth_router,
    employees_router,
    visits_router,
    sales_router,
    cases_router,
    goals_router,
    reports_router,
    dashboard_router,
    feedbacks_router,
)

app = FastAPI(
    title="SMA Panel API",
    description="Sales Management Application API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(employees_router)
app.include_router(visits_router)
app.include_router(sales_router)
app.include_router(cases_router)
app.include_router(goals_router)
app.include_router(reports_router)
app.include_router(dashboard_router)
app.include_router(feedbacks_router)


@app.on_event("startup")
def on_startup():
    """
    Initialize database on startup
    """
    init_db()


@app.get("/")
def root():
    """
    Root endpoint
    """
    return {
        "message": "Welcome to SMA Panel API",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy"}

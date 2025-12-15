from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import (
    auth_router,
    employees_router,
    sales_router,
    goals_router,
    reports_router,
    dashboard_router,
    weekly_programs_router,
    status_reports_router,
    pharmacies_router,
    daily_visits_router,
    settings_router,
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
app.include_router(sales_router)
app.include_router(goals_router)
app.include_router(reports_router)
app.include_router(dashboard_router)
app.include_router(weekly_programs_router)
app.include_router(status_reports_router)
app.include_router(pharmacies_router)
app.include_router(daily_visits_router)
app.include_router(settings_router)


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

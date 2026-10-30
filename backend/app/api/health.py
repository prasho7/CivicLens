"""Health check endpoint with database probe."""
from fastapi import APIRouter
from app.config import settings
from app.db.supabase import check_database_connection

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health_check():
    """
    Health check endpoint returning API operational status and database probe.
    Does not crash or fail if database credentials are not yet configured.
    """
    db_status = check_database_connection()

    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "database": db_status,
    }

"""Supabase database client initialization and query helpers."""
from typing import Optional, Any, Dict
import logging

from app.config import settings

logger = logging.getLogger("civiclens.db")

_client = None


class DatabaseNotConfiguredError(Exception):
    """Raised when an operation requires database access but credentials are not configured."""
    pass


def get_supabase_client():
    """
    Get or initialize the Supabase client.
    Raises DatabaseNotConfiguredError if SUPABASE_URL / SUPABASE_KEY are missing or placeholders.
    """
    global _client

    if not settings.is_database_configured:
        raise DatabaseNotConfiguredError(
            "Supabase database credentials are not configured. "
            "Please copy backend/.env.example to backend/.env and provide valid SUPABASE_URL and SUPABASE_KEY."
        )

    if _client is not None:
        return _client

    try:
        from supabase import create_client
        _client = create_client(settings.supabase_url, settings.supabase_key)
        return _client
    except ImportError:
        logger.warning("The 'supabase' package is not installed. Falling back to HTTP client.")
        # If the supabase package is not yet installed in venv, raise or use lightweight client
        raise DatabaseNotConfiguredError(
            "The 'supabase' Python package is not installed in the virtual environment. "
            "Run 'pip install -r requirements.txt' in backend/."
        )
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        raise e


def check_database_connection() -> Dict[str, Any]:
    """
    Probe the Supabase connection to verify connectivity.
    Returns status dictionary for health endpoints and diagnostics.
    """
    if not settings.is_database_configured:
        return {
            "configured": False,
            "status": "not_configured",
            "message": "Supabase credentials not provided in backend/.env",
        }

    try:
        client = get_supabase_client()
        # Probe table access
        response = client.table("reports").select("ref_id").limit(1).execute()
        return {
            "configured": True,
            "status": "connected",
            "message": "Connected to Supabase PostgreSQL database.",
        }
    except DatabaseNotConfiguredError as e:
        return {
            "configured": False,
            "status": "not_configured",
            "message": str(e),
        }
    except Exception as e:
        return {
            "configured": True,
            "status": "error",
            "message": f"Database query failed: {str(e)}",
        }


"""Tests for system health and diagnostics endpoint."""
from unittest.mock import patch


def test_health_endpoint_healthy(client):
    """Health check returns status ok and database connection details."""
    with patch("app.api.health.check_database_connection") as mock_conn:
        mock_conn.return_value = {
            "configured": True,
            "status": "connected",
            "message": "Connected to Supabase PostgreSQL database.",
        }
        res = client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["service"] == "CivicLens API"
        assert data["database"]["configured"] is True
        assert data["database"]["status"] == "connected"


def test_health_endpoint_unconfigured(client):
    """Health check reflects unconfigured database honestly without failing."""
    with patch("app.api.health.check_database_connection") as mock_conn:
        mock_conn.return_value = {
            "configured": False,
            "status": "not_configured",
            "message": "Supabase credentials not provided in backend/.env",
        }
        res = client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["database"]["configured"] is False
        assert data["database"]["status"] == "not_configured"


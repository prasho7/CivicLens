"""Pytest fixtures and mock database harness for CivicLens backend tests."""
import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings


SAMPLE_INCIDENTS = [
    {
        "id": "CIV-8402",
        "incident_number": "INC-2024-08402",
        "category": "Roads",
        "category_theme": "roads",
        "title": "Severe Pothole Cluster & Road Cave-In",
        "location": "MG Road near Primary School, Bengaluru",
        "priority": "Critical",
        "priority_level": "critical",
        "status": "In Progress",
        "status_level": "progress",
        "assigned_to": "Road Safety Response Unit 4",
        "is_urgent": True,
        "latitude": 12.9716,
        "longitude": 77.5946,
        "updates": [
            {
                "timestamp": "2024-05-18T10:30:00Z",
                "officer": "Lead Dispatcher Rao",
                "note": "Field crew on-site filling pothole with asphalt mix.",
                "status": "In Progress",
                "assigned_to": "Road Safety Response Unit 4",
            }
        ],
        "created_at": "2024-05-18T08:00:00Z",
    },
    {
        "id": "CIV-9120",
        "incident_number": "INC-2024-09120",
        "category": "Waterlogging",
        "category_theme": "water",
        "title": "Monsoon Underpass Submersion",
        "location": "Koramangala 80ft Road Underpass, Bengaluru",
        "priority": "Critical",
        "priority_level": "critical",
        "status": "Open",
        "status_level": "open",
        "assigned_to": "Stormwater Drainage Dept",
        "is_urgent": True,
        "latitude": 12.9352,
        "longitude": 77.6245,
        "updates": [],
        "created_at": "2024-05-18T07:15:00Z",
    },
]

SAMPLE_REPORTS = [
    {
        "id": "11111111-1111-1111-1111-111111111111",
        "ref_id": "SUB-D82A4F",
        "incident_id": "CIV-8402",
        "category": "Roads",
        "category_theme": "roads",
        "description": "Massive pothole near the pedestrian crossing. Dangerous for two-wheelers.",
        "location": "MG Road near Metro Station",
        "channel": "Citizen Web Portal",
        "status": "Under Review",
        "status_level": "review",
        "verified": True,
        "is_priority_evidence": True,
        "has_image": True,
        "image_url": None,
        "latitude": 12.9716,
        "longitude": 77.5946,
        "analysis": {
            "engine": "rule-based-fallback",
            "engine_name": "Rule-Based Intake Engine (Heuristic Fallback)",
            "is_ai_powered": False,
            "suggested_category": "Roads",
            "summary": "Massive road cavity endangering motorists near metro.",
            "priority": "High",
            "priority_level": "high",
            "priority_explanation": "Vehicle hazard near high-density pedestrian zone.",
            "evidence": ["Massive pothole", "Dangerous for two-wheelers"],
            "duplicate_suggestions": [],
            "notice": "Citizen-reported; not independently verified.",
        },
        "created_at": "2024-05-18T08:15:00Z",
    },
    {
        "id": "22222222-2222-2222-2222-222222222222",
        "ref_id": "SUB-UNLINK1",
        "incident_id": None,
        "category": "Waste",
        "category_theme": "waste",
        "description": "Uncollected commercial trash pile overflowing onto sidewalk for 4 days.",
        "location": "Indiranagar 100ft Road",
        "channel": "Citizen Web Portal",
        "status": "Submitted",
        "status_level": "submitted",
        "verified": False,
        "is_priority_evidence": False,
        "has_image": False,
        "image_url": None,
        "latitude": None,
        "longitude": None,
        "analysis": {
            "engine": "rule-based-fallback",
            "engine_name": "Rule-Based Intake Engine (Heuristic Fallback)",
            "is_ai_powered": False,
            "suggested_category": "Waste",
            "summary": "Overflowing garbage pile on pedestrian pathway.",
            "priority": "Medium",
            "priority_level": "medium",
            "priority_explanation": "Sanitation issue overflowing for multiple days.",
            "evidence": ["overflowing onto sidewalk", "4 days"],
            "duplicate_suggestions": [],
            "notice": "Citizen-reported; not independently verified.",
        },
        "created_at": "2024-05-18T09:00:00Z",
    },
]


class MockQueryBuilder:
    """Mock PostgREST query builder allowing chained query construction."""

    def __init__(self, data):
        self._data = [dict(d) for d in data]

    def select(self, *args, **kwargs):
        return self

    def insert(self, record):
        inserted = dict(record)
        if "id" not in inserted:
            inserted["id"] = "mock-uuid-" + inserted.get("ref_id", "0000")
        self._data = [inserted]
        return self

    def update(self, updates):
        updated_list = []
        for item in self._data:
            c = dict(item)
            c.update(updates)
            updated_list.append(c)
        self._data = updated_list
        return self

    def eq(self, column, value):
        self._data = [d for d in self._data if str(d.get(column)) == str(value)]
        return self

    def order(self, *args, **kwargs):
        return self

    def range(self, start, end):
        self._data = self._data[start : end + 1]
        return self

    def limit(self, count):
        self._data = self._data[:count]
        return self

    def execute(self):
        res = MagicMock()
        res.data = self._data
        return res


class MockSupabaseClient:
    """Mock Supabase client providing isolated in-memory tables."""

    def __init__(self, incidents=None, reports=None):
        self._incidents = list(incidents if incidents is not None else SAMPLE_INCIDENTS)
        self._reports = list(reports if reports is not None else SAMPLE_REPORTS)

    def table(self, table_name: str):
        if table_name == "incidents":
            return MockQueryBuilder(self._incidents)
        elif table_name == "reports":
            return MockQueryBuilder(self._reports)
        return MockQueryBuilder([])


@pytest.fixture(autouse=True)
def disable_external_network(monkeypatch):
    """Ensure automated tests never make external network calls to Gemini or Supabase."""
    monkeypatch.setattr(settings, "gemini_api_key", None)
    monkeypatch.setattr(settings, "google_api_key", None)
    with patch("app.services.analysis.run_gemini_analysis", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.return_value = None
        yield


@pytest.fixture
def mock_db():
    """Provides a fresh isolated MockSupabaseClient."""
    return MockSupabaseClient()


@pytest.fixture
def client(mock_db):
    """Provides a FastAPI TestClient with Supabase client patched to mock_db."""
    with patch("app.api.reports.get_supabase_client", return_value=mock_db), \
         patch("app.api.incidents.get_supabase_client", return_value=mock_db), \
         patch("app.db.supabase.get_supabase_client", return_value=mock_db):
        with TestClient(app) as tc:
            yield tc

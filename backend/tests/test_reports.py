"""Tests for citizen report submission, validation, retrieval, and linkage."""
import pytest


def test_submit_report_success(client):
    """Submitting a valid citizen report returns 201 with generated ref_id and analysis."""
    payload = {
        "category": "Roads",
        "description": "Hazardous pothole cluster outside the central bus depot causing vehicle damage.",
        "location": "Central Bus Depot Terminal, Bengaluru",
        "has_image": False,
    }
    res = client.post("/api/reports", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["ref_id"].startswith("SUB-")
    assert data["category"] == "Roads"
    assert data["incident_id"] is None, "Report must initially be unlinked in intake queue"
    assert data["status"] == "Submitted"
    assert data["analysis"] is not None
    assert data["analysis"]["suggested_category"] in ["Roads", "Road Safety"]
    assert data["analysis"]["notice"] == "Citizen-reported; not independently verified."


@pytest.mark.parametrize(
    "invalid_payload,expected_err_token",
    [
        (
            {"category": "InvalidCategoryName", "description": "This is a valid length description.", "location": "City Center"},
            "Invalid category",
        ),
        (
            {"category": "Roads", "description": "Too short", "location": "City Center"},
            "String should have at least 10 characters",
        ),
        (
            {"category": "Roads", "description": "            ", "location": "City Center"},
            "Field cannot consist solely of whitespace",
        ),
        (
            {"category": "Roads", "description": "Valid description text here", "location": "   "},
            "Field cannot consist solely of whitespace",
        ),
        (
            {"description": "Valid description text here", "location": "City Center"},
            "Field required",
        ),
    ],
)
def test_submit_report_validation_failures(client, invalid_payload, expected_err_token):
    """Submissions with missing or invalid fields return HTTP 422 Unprocessable Entity."""
    res = client.post("/api/reports", json=invalid_payload)
    assert res.status_code == 422
    assert expected_err_token.lower() in res.text.lower()


def test_list_reports(client):
    """GET /api/reports retrieves list of saved reports."""
    res = client.get("/api/reports")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(r["ref_id"] == "SUB-D82A4F" for r in data)


def test_get_report_by_ref_id_found(client):
    """GET /api/reports/{ref_id} returns existing report details."""
    res = client.get("/api/reports/SUB-D82A4F")
    assert res.status_code == 200
    data = res.json()
    assert data["ref_id"] == "SUB-D82A4F"
    assert data["incident_id"] == "CIV-8402"


def test_get_report_by_ref_id_not_found(client):
    """GET /api/reports/{ref_id} returns 404 for unknown reference ID."""
    res = client.get("/api/reports/SUB-NONEXISTENT")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_link_report_to_incident_success(client):
    """PATCH /api/reports/{ref_id}/link updates incident_id and advances status to Under Review."""
    link_payload = {"incident_id": "CIV-8402"}
    res = client.patch("/api/reports/SUB-UNLINK1/link", json=link_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["ref_id"] == "SUB-UNLINK1"
    assert data["incident_id"] == "CIV-8402"
    assert data["status"] == "Under Review"


def test_link_report_to_nonexistent_incident(client):
    """Linking to a nonexistent incident returns 404."""
    link_payload = {"incident_id": "CIV-NONEXISTENT"}
    res = client.patch("/api/reports/SUB-UNLINK1/link", json=link_payload)
    assert res.status_code == 404
    assert "Incident 'CIV-NONEXISTENT' not found" in res.json()["detail"]


def test_link_nonexistent_report_to_incident(client):
    """Linking a nonexistent report returns 404."""
    link_payload = {"incident_id": "CIV-8402"}
    res = client.patch("/api/reports/SUB-NONEXISTENT/link", json=link_payload)
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


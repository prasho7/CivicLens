"""Tests for municipal incidents retrieval, officer updates, and audit logging."""
import pytest


def test_list_incidents(client):
    """GET /api/incidents lists active municipal incidents."""
    res = client.get("/api/incidents")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    assert any(inc["id"] == "CIV-8402" for inc in data)


def test_get_incident_by_id_found(client):
    """GET /api/incidents/{incident_id} retrieves a specific incident."""
    res = client.get("/api/incidents/CIV-8402")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "CIV-8402"
    assert data["category"] == "Roads"
    assert data["latitude"] == 12.9716


def test_get_incident_by_id_not_found(client):
    """GET /api/incidents/{incident_id} returns 404 when incident does not exist."""
    res = client.get("/api/incidents/CIV-9999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_update_incident_status_and_assignment(client):
    """PATCH /api/incidents/{incident_id} updates status, assigned team, and appends audit note."""
    update_payload = {
        "status": "In Progress",
        "assigned_to": "Road Safety Emergency Team",
        "note": "Field crew dispatched with asphalt compactor.",
        "officer": "Dispatcher Rao",
    }
    res = client.patch("/api/incidents/CIV-8402", json=update_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "CIV-8402"
    assert data["status"] == "In Progress"
    assert data["assigned_to"] == "Road Safety Emergency Team"
    # Ensure audit note was appended
    assert len(data["updates"]) >= 1
    latest_update = data["updates"][-1]
    assert latest_update["officer"] == "Dispatcher Rao"
    assert "asphalt compactor" in latest_update["note"]


def test_update_nonexistent_incident(client):
    """PATCH /api/incidents/{incident_id} returns 404 for unknown incident."""
    update_payload = {
        "status": "Resolved",
        "note": "Non-existent ticket check",
    }
    res = client.patch("/api/incidents/CIV-NOTFOUND", json=update_payload)
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

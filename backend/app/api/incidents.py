"""API routes for municipal incident clusters."""
import secrets
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.report import IncidentResponse, ReportResponse, IncidentUpdateRequest
from app.db.supabase import get_supabase_client, DatabaseNotConfiguredError

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


@router.get(
    "",
    response_model=List[IncidentResponse],
    summary="List municipal incident clusters",
)
def list_incidents(
    priority: Optional[str] = Query(None, description="Filter by priority (Critical, High, Medium, Low)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (Open, Under Review, Resolved)"),
):
    """
    Retrieve incident clusters from Supabase database.
    """
    try:
        client = get_supabase_client()
        query = client.table("incidents").select("*")

        if priority:
            query = query.eq("priority", priority)
        if status_filter:
            query = query.eq("status", status_filter)

        query = query.order("incident_number", desc=False)
        result = query.execute()

        return [IncidentResponse(**row) for row in result.data or []]
    except DatabaseNotConfiguredError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured. Configure SUPABASE_URL and SUPABASE_KEY in backend/.env to query incidents.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query incidents: {str(e)}",
        )


@router.get(
    "/{incident_id}",
    response_model=IncidentResponse,
    summary="Retrieve incident by ID",
)
def get_incident(incident_id: str):
    """
    Retrieve a specific incident cluster by its ID (e.g. CIV-8402).
    """
    try:
        client = get_supabase_client()
        result = client.table("incidents").select("*").eq("id", incident_id).execute()

        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Incident '{incident_id}' not found.",
            )

        return IncidentResponse(**result.data[0])
    except DatabaseNotConfiguredError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured. Configure SUPABASE_URL and SUPABASE_KEY in backend/.env.",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve incident: {str(e)}",
        )


@router.get(
    "/{incident_id}/reports",
    response_model=List[ReportResponse],
    summary="List citizen reports linked to an incident",
)
def get_incident_reports(incident_id: str):
    """
    Retrieve all individual citizen reports linked to an incident cluster.
    """
    try:
        client = get_supabase_client()
        result = client.table("reports").select("*").eq("incident_id", incident_id).order("created_at", desc=True).execute()

        return [ReportResponse(**row) for row in result.data or []]
    except DatabaseNotConfiguredError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured. Configure SUPABASE_URL and SUPABASE_KEY in backend/.env.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve linked reports: {str(e)}",
        )


@router.patch(
    "/{incident_id}",
    response_model=IncidentResponse,
    summary="Update incident status, assignment, and record officer updates",
)
def update_incident(incident_id: str, payload: IncidentUpdateRequest):
    """
    Officer management endpoint:
    - Assign incident to a department or team
    - Transition status: Open -> Acknowledged -> In Progress -> Resolved
    - Append update / resolution note to the incident's audit history
    - Persist changes to Supabase PostgreSQL database
    """
    try:
        client = get_supabase_client()
        res = client.table("incidents").select("*").eq("id", incident_id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Incident '{incident_id}' not found.",
            )
        current = res.data[0]

        updates_payload = {}
        history = list(current.get("updates") or [])

        # Status transition
        if payload.status:
            clean_status = payload.status.strip()
            status_level_map = {
                "open": "open",
                "acknowledged": "review",
                "in progress": "review",
                "under review": "review",
                "resolved": "resolved",
            }
            updates_payload["status"] = clean_status
            updates_payload["status_level"] = status_level_map.get(clean_status.lower(), "open")

        # Assignment update
        if payload.assigned_to is not None:
            updates_payload["assigned_to"] = payload.assigned_to.strip() if payload.assigned_to else None

        # Add history audit entry
        if payload.note or payload.status or payload.assigned_to:
            now_iso = datetime.now(timezone.utc).isoformat()
            audit_entry = {
                "id": f"UPD-{secrets.token_hex(2).upper()}",
                "timestamp": now_iso,
                "officer": payload.officer or "Duty Officer",
                "status": updates_payload.get("status", current.get("status")),
                "assigned_to": updates_payload.get("assigned_to", current.get("assigned_to")),
                "note": payload.note.strip() if payload.note else f"Updated incident: status={updates_payload.get('status', current.get('status'))}",
            }
            history.append(audit_entry)
            updates_payload["updates"] = history

        updates_payload["updated_at"] = datetime.now(timezone.utc).isoformat()

        # Update in Supabase
        update_res = client.table("incidents").update(updates_payload).eq("id", incident_id).execute()
        if not update_res.data or len(update_res.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database update returned no data.",
            )

        return IncidentResponse(**update_res.data[0])
    except DatabaseNotConfiguredError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update incident: {str(e)}",
        )


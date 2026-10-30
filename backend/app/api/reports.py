"""API routes for citizen reports with AI understanding and duplicate detection."""
from typing import List, Optional
import logging
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.report import (
    ReportCreate,
    ReportResponse,
    DraftAnalysisRequest,
    AnalysisResult,
    LinkReportRequest,
    generate_ref_id,
    category_to_theme,
)
from app.db.supabase import get_supabase_client, DatabaseNotConfiguredError
from app.services.analysis import analyze_report

logger = logging.getLogger("civiclens.reports")

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post(
    "/analyze-draft",
    response_model=AnalysisResult,
    summary="Analyze draft complaint without saving to database",
)
async def analyze_draft(payload: DraftAnalysisRequest):
    """
    Generate intelligence analysis (category suggestion, summary, priority explanation,
    evidence extraction, and candidate duplicate matching) for draft complaint text.
    Uses real Gemini AI if configured, or deterministic rule-based fallback if offline.
    """
    incidents_data = []
    try:
        client = get_supabase_client()
        inc_res = client.table("incidents").select("*").execute()
        incidents_data = inc_res.data or []
    except Exception as e:
        logger.warning(f"Could not load incidents for duplicate matching: {e}")

    return await analyze_report(
        category=payload.category or "Roads",
        description=payload.description,
        location=payload.location or "Bengaluru",
        incidents=incidents_data,
    )


@router.post(
    "",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new citizen complaint report",
)
async def create_report(payload: ReportCreate):
    """
    Create and record a new citizen complaint report.
    Generates a unique reference ID (SUB-XXXXXX) if not provided.
    Runs intelligence analysis to evaluate priority, extract evidence, and detect duplicate candidates.
    Inserts into the Supabase 'reports' table if database is configured.
    """
    ref_id = payload.ref_id or generate_ref_id()
    theme = category_to_theme(payload.category)

    # 1. Fetch active incidents for duplicate detection
    incidents_data = []
    try:
        client = get_supabase_client()
        inc_res = client.table("incidents").select("*").execute()
        incidents_data = inc_res.data or []
    except Exception as e:
        logger.warning(f"Could not load incidents for duplicate matching: {e}")

    # 2. Run analysis (AI or clearly labeled rule-based fallback)
    analysis_dict = None
    try:
        analysis_res = await analyze_report(
            category=payload.category,
            description=payload.description,
            location=payload.location,
            incidents=incidents_data,
        )
        analysis_dict = analysis_res.model_dump()
    except Exception as e:
        logger.warning(f"Analysis generation encountered an error: {e}")

    report_record = {
        "ref_id": ref_id,
        "incident_id": payload.incident_id,
        "category": payload.category,
        "category_theme": theme,
        "description": payload.description,
        "location": payload.location,
        "channel": payload.channel,
        "status": "Submitted",
        "status_level": "submitted",
        "verified": False,
        "is_priority_evidence": False,
        "has_image": payload.has_image,
        "image_url": payload.image_url,
        "analysis": analysis_dict,
    }

    try:
        client = get_supabase_client()
        result = client.table("reports").insert(report_record).execute()
        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database insert returned no data.",
            )
        row = result.data[0]
        return ReportResponse(**row)
    except DatabaseNotConfiguredError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Database is not configured yet. "
                "Please configure SUPABASE_URL and SUPABASE_KEY in backend/.env to persist reports."
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record report in Supabase database: {str(e)}",
        )


@router.get(
    "",
    response_model=List[ReportResponse],
    summary="List citizen reports",
)
def list_reports(
    limit: int = Query(50, ge=1, le=100, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Records offset"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (e.g. Submitted, Open, Resolved)"),
    incident_id: Optional[str] = Query(None, description="Filter by linked incident cluster ID"),
):
    """
    Retrieve reports from the Supabase database.
    Supports filtering by status and linked incident.
    """
    try:
        client = get_supabase_client()
        query = client.table("reports").select("*")

        if status_filter:
            query = query.eq("status", status_filter)
        if incident_id:
            query = query.eq("incident_id", incident_id)

        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        result = query.execute()

        return [ReportResponse(**row) for row in result.data or []]
    except DatabaseNotConfiguredError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured. Configure SUPABASE_URL and SUPABASE_KEY in backend/.env to retrieve reports.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query reports from database: {str(e)}",
        )


@router.get(
    "/{ref_id}",
    response_model=ReportResponse,
    summary="Retrieve report by reference ID",
)
def get_report(ref_id: str):
    """
    Retrieve a specific report by its reference ID (e.g. SUB-D82A4F or REP-101).
    Returns 404 if not found.
    """
    try:
        client = get_supabase_client()
        result = client.table("reports").select("*").eq("ref_id", ref_id).execute()

        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report with reference ID '{ref_id}' not found.",
            )

        return ReportResponse(**result.data[0])
    except DatabaseNotConfiguredError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured. Configure SUPABASE_URL and SUPABASE_KEY in backend/.env to query reports.",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve report: {str(e)}",
        )


@router.post(
    "/{ref_id}/analyze",
    response_model=ReportResponse,
    summary="Run or refresh intelligence analysis for an existing report",
)
async def analyze_existing_report(ref_id: str):
    """
    Run or refresh intelligence analysis for an existing saved report.
    Persists updated analysis to the Supabase database.
    """
    try:
        client = get_supabase_client()
        rep_res = client.table("reports").select("*").eq("ref_id", ref_id).execute()

        if not rep_res.data or len(rep_res.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report with reference ID '{ref_id}' not found.",
            )

        report = rep_res.data[0]

        # Load incidents for duplicate matching
        inc_res = client.table("incidents").select("*").execute()
        incidents_data = inc_res.data or []

        analysis_res = await analyze_report(
            category=report.get("category", "Roads"),
            description=report.get("description", ""),
            location=report.get("location", ""),
            incidents=incidents_data,
        )

        analysis_dict = analysis_res.model_dump()

        update_res = client.table("reports").update({"analysis": analysis_dict}).eq("ref_id", ref_id).execute()
        if not update_res.data or len(update_res.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update report with analysis results.",
            )

        return ReportResponse(**update_res.data[0])
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
            detail=f"Failed to analyze report: {str(e)}",
        )


@router.patch(
    "/{ref_id}/link",
    response_model=ReportResponse,
    summary="Link an unassigned citizen report to an incident cluster",
)
def link_report_to_incident(ref_id: str, payload: LinkReportRequest):
    """
    Officer action: explicitly links an unassigned citizen report to an existing incident cluster.
    Updates report status to 'Under Review' and stores the target incident_id in Supabase.
    """
    try:
        from datetime import datetime, timezone
        client = get_supabase_client()

        # 1. Verify incident exists
        inc_res = client.table("incidents").select("id").eq("id", payload.incident_id).execute()
        if not inc_res.data or len(inc_res.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Incident '{payload.incident_id}' not found.",
            )

        # 2. Update report
        now_iso = datetime.now(timezone.utc).isoformat()
        update_res = client.table("reports").update({
            "incident_id": payload.incident_id,
            "status": "Under Review",
            "status_level": "review",
            "updated_at": now_iso,
        }).eq("ref_id", ref_id).execute()

        if not update_res.data or len(update_res.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report with reference ID '{ref_id}' not found.",
            )

        return ReportResponse(**update_res.data[0])
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
            detail=f"Failed to link report to incident: {str(e)}",
        )

"""Pydantic models for reports and incidents matching CivicLens frontend data structures."""
import secrets
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


VALID_CATEGORIES = [
    "Waterlogging",
    "Roads",
    "Waste",
    "Streetlights",
    "Drainage",
    "Road Safety",
    "Waste Management",
    "Street Lighting",
    "Water Supply",
]


def generate_ref_id() -> str:
    """Generate a unique citizen report reference ID matching the frontend format: SUB-XXXXXX."""
    hex_code = secrets.token_hex(3).upper()
    return f"SUB-{hex_code}"


def category_to_theme(category: str) -> str:
    """Map civic category to UI visual theme."""
    cat_lower = category.lower()
    if "water" in cat_lower or "drain" in cat_lower:
        return "water"
    elif "road" in cat_lower:
        return "roads"
    elif "waste" in cat_lower or "garbage" in cat_lower:
        return "waste"
    elif "light" in cat_lower:
        return "lighting"
    return "roads"


class ReportCreate(BaseModel):
    """Payload to create a new citizen complaint report."""
    category: str = Field(..., description="Category of the civic issue (e.g. Waterlogging, Roads, Waste, Streetlights, Drainage)")
    description: str = Field(..., min_length=10, max_length=1000, description="Detailed description of the civic problem")
    location: str = Field(..., min_length=3, max_length=200, description="Location, landmark, or street address")
    has_image: bool = Field(False, description="Whether a local photo was attached")
    image_url: Optional[str] = Field(None, description="Optional image URL or reference")
    channel: str = Field("Citizen Web Portal", description="Reporting channel")
    ref_id: Optional[str] = Field(None, description="Optional custom reference ID; auto-generated if omitted")
    incident_id: Optional[str] = Field(None, description="Optional link to an existing incident cluster")

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Category cannot be empty.")
        clean_lower = clean.lower()
        valid_lower = [c.lower() for c in VALID_CATEGORIES]
        if clean_lower not in valid_lower:
            allowed = ", ".join(VALID_CATEGORIES[:5])
            raise ValueError(f"Invalid category '{clean}'. Allowed categories include: {allowed}.")
        return clean

    @field_validator("description", "location")
    @classmethod
    def validate_non_empty_text(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Field cannot consist solely of whitespace.")
        return clean


class DuplicateMatch(BaseModel):
    """Potential duplicate incident cluster candidate for officer review."""
    incident_id: str = Field(..., description="ID of the potential duplicate incident (e.g. CIV-8402)")
    incident_title: str = Field(..., description="Title of the candidate incident")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Match confidence score between 0.0 and 1.0")
    match_reason: str = Field(..., description="Specific rationale explaining why this incident is a candidate match")
    meets_threshold: bool = Field(False, description="Whether confidence meets the system duplicate threshold")


class AnalysisResult(BaseModel):
    """Structured intelligence analysis result for a citizen report."""
    engine: str = Field("rule-based-fallback", description="Engine identifier: 'gemini-1.5-flash' or 'rule-based-fallback'")
    engine_name: str = Field("Rule-Based Intake Engine (Heuristic Fallback)", description="Human-readable engine name")
    is_ai_powered: bool = Field(False, description="False when rule-based fallback was used; true only when real AI generated the result")
    suggested_category: str = Field(..., description="Suggested municipal civic issue category")
    summary: str = Field(..., description="Concise 1-2 sentence executive summary of the complaint")
    priority: str = Field(..., description="Assessed priority: Critical, High, Medium, or Low")
    priority_level: str = Field("medium", description="Priority level token: critical, high, medium, low")
    priority_explanation: str = Field(..., description="Clear explanation for the assigned priority level")
    evidence: List[str] = Field(default_factory=list, description="Extracted factual evidence quotes/phrases from description")
    duplicate_suggestions: List[DuplicateMatch] = Field(default_factory=list, description="Candidate duplicate incidents for human review")
    analyzed_at: Optional[str] = None
    notice: str = "Citizen-reported; not independently verified."


class ReportResponse(BaseModel):
    """Response model representing a citizen complaint report."""
    id: Optional[str] = None
    ref_id: str = Field(..., description="Unique human-readable reference identifier (e.g. SUB-D82A4F)")
    incident_id: Optional[str] = Field(None, description="Linked incident ID or NULL for unassigned queue")
    category: str
    category_theme: str = "roads"
    description: str
    location: str
    channel: str = "Citizen Web Portal"
    status: str = "Submitted"
    status_level: str = "submitted"
    verified: bool = False
    is_priority_evidence: bool = False
    has_image: bool = False
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    analysis: Optional[AnalysisResult] = None
    created_at: Optional[str] = None


class DraftAnalysisRequest(BaseModel):
    """Payload to analyze a draft complaint before final submission."""
    category: Optional[str] = None
    description: str = Field(..., min_length=10, max_length=2000, description="Citizen complaint text")
    location: Optional[str] = None


class IncidentResponse(BaseModel):
    """Response model representing an underlying incident cluster."""
    id: str = Field(..., description="Unique incident identifier (e.g. CIV-8402)")
    incident_number: str
    category: str
    category_theme: str
    title: str
    location: str
    priority: str
    priority_level: str
    status: str
    status_level: str
    assigned_to: Optional[str] = None
    is_urgent: bool = False
    zone: Optional[str] = None
    intake_window: Optional[str] = None
    cluster_pattern: Optional[str] = None
    evidence_risk_tag: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    updates: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    created_at: Optional[str] = None


class IncidentUpdateRequest(BaseModel):
    """Payload for officer incident management updates."""
    status: Optional[str] = Field(None, description="Updated status (Open, Acknowledged, In Progress, Resolved)")
    assigned_to: Optional[str] = Field(None, description="Department or team assigned")
    note: Optional[str] = Field(None, description="Operational update or resolution note")
    officer: Optional[str] = Field("Duty Officer", description="Name/title of updating officer")


class LinkReportRequest(BaseModel):
    """Payload to link an unassigned citizen report to an incident cluster."""
    incident_id: str = Field(..., description="Target incident ID (e.g. CIV-8402)")


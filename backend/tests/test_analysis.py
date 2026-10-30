"""Tests for AI/rule-based report understanding, priority scoring, and duplicate detection."""
import pytest
from app.services.analysis import analyze_report, run_rule_based_analysis


@pytest.mark.anyio
async def test_priority_assessment_critical():
    """Safety-critical indicators like school crossings or collapsed infrastructure yield Critical priority."""
    result = await analyze_report(
        category="Roads",
        description="Hazardous road collapse near the elementary school crossing. Severe injury risk for children.",
        location="MG Road Elementary Gate",
        incidents=[],
    )
    assert result.priority == "Critical"
    assert result.priority_level == "critical"
    assert "Critical safety hazard" in result.priority_explanation or "school" in result.priority_explanation.lower()
    assert len(result.evidence) > 0


@pytest.mark.anyio
async def test_priority_assessment_high():
    """Transit disruption or vehicle hazards yield High priority."""
    result = await analyze_report(
        category="Roads",
        description="Deep pothole causing vehicle damage and wheel damage during evening commute.",
        location="Outer Ring Road",
        incidents=[],
    )
    assert result.priority == "High"
    assert result.priority_level == "high"


@pytest.mark.anyio
async def test_priority_assessment_low():
    """Cosmetic or minor aesthetic issues yield Low priority."""
    result = await analyze_report(
        category="Roads",
        description="Faded paint on lane markings, cosmetic wear but road surface is intact.",
        location="12th Main Road",
        incidents=[],
    )
    assert result.priority == "Low"
    assert result.priority_level == "low"


@pytest.mark.anyio
async def test_suggested_category_matching():
    """Category heuristics accurately classify issue based on content keywords."""
    res_water = await analyze_report(
        category="Roads",  # User misclassified as Roads
        description="Massive flood and waterlogging under the railway underpass, completely submerged.",
        location="Koramangala",
        incidents=[],
    )
    assert res_water.suggested_category == "Waterlogging"

    res_waste = await analyze_report(
        category="Streetlights",  # User misclassified
        description="Overflowing garbage bins with foul stench and rotten trash scattered across the street.",
        location="Indiranagar",
        incidents=[],
    )
    assert res_waste.suggested_category == "Waste"


@pytest.mark.anyio
async def test_duplicate_candidate_detection(mock_db):
    """Duplicate suggestions identify candidate incidents matching category and location tokens without merging."""
    incidents = mock_db._incidents

    result = await analyze_report(
        category="Roads",
        description="Enormous pothole cluster on MG Road near the school divider. Cars swerving dangerously.",
        location="MG Road Bengaluru",
        incidents=incidents,
    )

    assert len(result.duplicate_suggestions) > 0
    top_match = result.duplicate_suggestions[0]
    assert top_match.incident_id == "CIV-8402"
    assert top_match.confidence > 0.0
    assert len(top_match.match_reason) > 0


def test_analyze_draft_endpoint(client):
    """POST /api/reports/analyze-draft provides instant triage without writing to database."""
    payload = {
        "category": "Drainage",
        "description": "Clogged storm drain grate causing rainwater accumulation during heavy showers.",
        "location": "JP Nagar 6th Phase",
    }
    res = client.post("/api/reports/analyze-draft", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["suggested_category"] in ["Drainage", "Waterlogging"]
    assert data["priority"] in ["Critical", "High", "Medium", "Low"]
    assert "notice" in data
    assert data["notice"] == "Citizen-reported; not independently verified."

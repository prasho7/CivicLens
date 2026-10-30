"""
AI-powered and Rule-based Report Understanding & Duplicate Detection Service.
Provides intelligence analysis for citizen complaint submissions:
1. Suggested category identification
2. Concise incident summary
3. Priority assessment (Critical, High, Medium, Low) with explicit justification
4. Evidence extraction (factual phrases from citizen description)
5. Duplicate candidate detection against existing municipal incidents

Strictly distinguishes between real AI and rule-based fallback:
- When AI API key is configured and responsive: engine = 'gemini-1.5-flash', is_ai_powered = True
- When AI key is unavailable or fails: engine = 'rule-based-fallback', is_ai_powered = False
- Notice: 'Citizen-reported; not independently verified.'
"""
import re
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import httpx

from app.config import settings
from app.schemas.report import AnalysisResult, DuplicateMatch

logger = logging.getLogger("civiclens.analysis")

# Category vocabulary and priority keywords
CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "Waterlogging": ["flood", "flooded", "waterlogging", "submerged", "standing water", "inundation", "water logging"],
    "Drainage": ["drain", "storm drain", "grate", "manhole", "gutter", "sewage", "sewer", "culvert", "runoff"],
    "Roads": ["pothole", "crater", "asphalt", "road", "tar", "divider", "pavement", "sidewalk", "footpath", "speed breaker"],
    "Waste": ["garbage", "trash", "waste", "debris", "litter", "dump", "bin", "overflowing", "stench", "foul smell"],
    "Streetlights": ["streetlight", "street light", "dark", "bulb", "lamp post", "lighting", "blackout", "illumination"],
}

# High-risk & urgency indicators for priority scoring
CRITICAL_INDICATORS = [
    "school", "hospital", "kindergarten", "elderly", "ambulance", "emergency",
    "collapsed", "live wire", "electric shock", "deep cavity", "bursting", "burst pipe",
    "severe injury", "swerving into traffic", "impassable", "submerged bus",
    "water entering basement", "water entering house", "flooding homes", "falling tree",
]

HIGH_INDICATORS = [
    "bus lane blocked", "main road blocked", "arterial", "transit", "accident risk",
    "3 days", "overflowing for days", "health hazard", "pest infestation",
    "sharp grate", "wheel damage", "vehicle damage", "brake abruptly", "cyclist fell",
    "pitch dark", "pedestrian hazard", "cannot walk",
]

LOW_INDICATORS = [
    "faded paint", "cosmetic", "minor litter", "mild crack", "small sign tilted",
    "leaf accumulation", "aesthetic", "noticeable but safe",
]


def _clean_text(text: str) -> str:
    """Normalize text for token matching."""
    return re.sub(r"[^\w\s]", " ", text.lower())


def _extract_evidence_phrases(description: str) -> List[str]:
    """Extract factual, observational clauses indicating physical conditions and risks."""
    sentences = re.split(r"[.\n;!?]+", description)
    evidence = []
    
    action_words = [
        "swerving", "brake", "abruptly", "damage", "flooding", "overflowing",
        "dark", "hazard", "collapsed", "cavity", "blocked", "entering",
        "eroding", "caught", "stuck", "snapped", "obstruction", "foul smell",
        "pothole", "leak", "grate",
    ]
    
    for s in sentences:
        s_clean = s.strip()
        if len(s_clean) < 12:
            continue
        s_lower = s_clean.lower()
        if any(w in s_lower for w in action_words):
            # Shorten if overly long
            if len(s_clean) > 140:
                s_clean = s_clean[:137] + "…"
            evidence.append(s_clean)
            if len(evidence) >= 3:
                break
                
    if not evidence and len(description.strip()) > 0:
        first_sentence = sentences[0].strip()
        evidence.append(first_sentence[:140])
        
    return evidence


def _determine_priority(description: str, location: str, category: str) -> tuple[str, str, str]:
    """
    Assess priority based on vulnerability, danger to life, and infrastructure disruption.
    Returns: (priority_label, priority_level, priority_explanation)
    """
    desc_lower = description.lower()
    loc_lower = location.lower()
    combined = f"{desc_lower} {loc_lower}"

    # Critical check
    found_critical = [ind for ind in CRITICAL_INDICATORS if ind in combined]
    if found_critical:
        explanation = (
            f"Elevated to Critical priority due to detected public safety indicators: '{', '.join(found_critical[:2])}'. "
            "Report describes immediate risk to pedestrians, school/medical access, or structural integrity. "
            "Citizen-reported; not independently verified."
        )
        return "Critical", "critical", explanation

    # High check
    found_high = [ind for ind in HIGH_INDICATORS if ind in combined]
    if found_high:
        explanation = (
            f"Assigned High priority due to operational transit or health hazard indicators: '{', '.join(found_high[:2])}'. "
            "May cause vehicular damage, public thoroughfare obstruction, or sanitary hazard. "
            "Citizen-reported; not independently verified."
        )
        return "High", "high", explanation

    # Low check
    found_low = [ind for ind in LOW_INDICATORS if ind in combined]
    if found_low:
        explanation = (
            "Assigned Low priority: report describes localized or cosmetic concern without immediate safety risk. "
            "Citizen-reported; not independently verified."
        )
        return "Low", "low", explanation

    # Default Medium
    explanation = (
        f"Assigned Medium priority: localized {category or 'civic'} issue requiring scheduled field inspection. "
        "No acute life-safety risk or arterial corridor blockage reported. "
        "Citizen-reported; not independently verified."
    )
    return "Medium", "medium", explanation


def _suggest_category(description: str, default_category: Optional[str] = None) -> str:
    """Identify best category match based on description keyword frequency."""
    desc_clean = _clean_text(description)
    scores: Dict[str, int] = {}
    
    for cat, kws in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in kws if f" {kw} " in f" {desc_clean} ")
        scores[cat] = score

    top_cat = max(scores, key=scores.get)
    if scores[top_cat] > 0:
        return top_cat

    if default_category and default_category in CATEGORY_KEYWORDS:
        return default_category
        
    return default_category or "Roads"


def _generate_summary(description: str, category: str, location: str) -> str:
    """Generate concise 1-2 sentence executive summary."""
    clean = description.strip()
    first_period = clean.find(".")
    if first_period > 20 and first_period < 150:
        summary_base = clean[:first_period].strip()
    else:
        summary_base = clean[:120].strip()

    if not summary_base.endswith("."):
        summary_base += "."
        
    if location and location not in summary_base:
        return f"{summary_base} Reported at {location}."
    return summary_base


def _calculate_duplicate_matches(
    new_category: str,
    new_description: str,
    new_location: str,
    incidents: List[Dict[str, Any]],
    threshold: float = 0.60,
) -> List[DuplicateMatch]:
    """
    Compare new complaint against existing incident clusters using:
    1. Category alignment (weight: 0.30)
    2. Geographic corridor/ward match (weight: 0.35)
    3. Problem keyword similarity (weight: 0.35)
    
    Never merges records automatically; surfaces candidates for officer review.
    """
    matches: List[DuplicateMatch] = []
    new_desc_tokens = set(_clean_text(new_description).split())
    new_loc_clean = _clean_text(new_location)

    # Key geographic identifiers to check
    known_areas = [
        "mg road", "indiranagar", "jayanagar", "koramangala", "whitefield",
        "malleshwaram", "hebbal", "ward 112", "ward 84", "ward 153",
        "ward 151", "ward 85", "ward 45",
    ]
    detected_new_areas = [area for area in known_areas if area in new_loc_clean or area in _clean_text(new_description)]

    for inc in incidents:
        inc_id = inc.get("id", "UNKNOWN")
        inc_title = inc.get("title", "")
        inc_cat = inc.get("category", "")
        inc_loc = inc.get("location", "")
        inc_desc = inc.get("cluster_pattern", "") + " " + inc.get("title", "")

        score = 0.0
        reasons = []

        # 1. Category match (0.30)
        # Normalize category names
        cat_map = {
            "roads": "roads", "road safety": "roads",
            "waste": "waste", "waste management": "waste",
            "streetlights": "lighting", "street lighting": "lighting",
            "water": "water", "water supply": "water", "waterlogging": "water", "drainage": "water",
        }
        norm_new_cat = cat_map.get(new_category.lower(), new_category.lower())
        norm_inc_cat = cat_map.get(inc_cat.lower(), inc_cat.lower())

        if norm_new_cat == norm_inc_cat:
            score += 0.30
            reasons.append(f"Matching category ({new_category})")

        # 2. Location match (0.35)
        inc_loc_clean = _clean_text(f"{inc_loc} {inc.get('zone', '')}")
        shared_areas = [area for area in detected_new_areas if area in inc_loc_clean]
        
        # Check direct street/area substring
        if shared_areas:
            score += 0.35
            reasons.append(f"Same geographic area ({', '.join(shared_areas)})")
        else:
            # Check token overlap in location strings
            loc_tokens_new = set(new_loc_clean.split())
            loc_tokens_inc = set(inc_loc_clean.split())
            shared_loc_words = (loc_tokens_new & loc_tokens_inc) - {"bengaluru", "road", "street", "urban", "ward"}
            if shared_loc_words:
                score += 0.25
                reasons.append(f"Shared location terms ({', '.join(shared_loc_words)})")

        # 3. Problem keyword similarity (0.35)
        inc_tokens = set(_clean_text(inc_desc).split())
        shared_keywords = (new_desc_tokens & inc_tokens) - {
            "the", "and", "is", "at", "in", "near", "to", "of", "a", "an", "this", "road", "street", "city"
        }
        
        if shared_keywords:
            keyword_score = min(0.35, len(shared_keywords) * 0.12)
            score += keyword_score
            reasons.append(f"Shared problem keywords ('{', '.join(list(shared_keywords)[:3])}')")

        score = round(min(1.0, score), 2)

        # Show candidate if score >= 0.45, with threshold flag
        if score >= 0.45:
            reason_str = "; ".join(reasons) if reasons else "Partial topic overlap"
            matches.append(DuplicateMatch(
                incident_id=inc_id,
                incident_title=inc_title,
                confidence=score,
                match_reason=f"{reason_str}. Candidate for officer review; not automatically merged.",
                meets_threshold=bool(score >= threshold),
            ))

    # Sort descending by confidence score
    matches.sort(key=lambda m: m.confidence, reverse=True)
    return matches[:3]


def run_rule_based_analysis(
    category: str,
    description: str,
    location: str,
    incidents: List[Dict[str, Any]],
    threshold: float = 0.60,
) -> AnalysisResult:
    """
    Deterministic rule-based intake analysis engine (Heuristic Fallback).
    Used when AI API key is not configured or offline.
    Explicitly identifies as rule-based fallback — does not claim to be AI.
    """
    suggested_cat = _suggest_category(description, category)
    priority_label, priority_level, priority_exp = _determine_priority(description, location, suggested_cat)
    summary = _generate_summary(description, suggested_cat, location)
    evidence = _extract_evidence_phrases(description)
    duplicates = _calculate_duplicate_matches(suggested_cat, description, location, incidents, threshold)
    now_iso = datetime.now(timezone.utc).isoformat()

    return AnalysisResult(
        engine="rule-based-fallback",
        engine_name="Rule-Based Intake Engine (Heuristic Fallback)",
        is_ai_powered=False,
        suggested_category=suggested_cat,
        summary=summary,
        priority=priority_label,
        priority_level=priority_level,
        priority_explanation=priority_exp,
        evidence=evidence,
        duplicate_suggestions=duplicates,
        analyzed_at=now_iso,
        notice="Citizen-reported; not independently verified.",
    )


async def run_gemini_analysis(
    api_key: str,
    category: str,
    description: str,
    location: str,
    incidents: List[Dict[str, Any]],
    threshold: float = 0.60,
) -> Optional[AnalysisResult]:
    """
    Invoke Google Gemini API via secure REST endpoint to generate report intelligence.
    Returns None if the API times out, fails, or returns malformed data (promptly triggering fallback).
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

    # Prepare existing incidents list for duplicate assessment
    incidents_context = [
        {"id": inc.get("id"), "title": inc.get("title"), "category": inc.get("category"), "location": inc.get("location")}
        for inc in incidents[:10]
    ]

    prompt = f"""
You are the CivicLens municipal intelligence analysis engine.
Analyze the following citizen civic complaint report and compare against known active incidents.

Citizen Report:
- Category Selected: {category}
- Location: {location}
- Description: {description}

Existing Active Incidents:
{json.dumps(incidents_context, indent=2)}

Output ONLY valid JSON with this exact schema:
{{
  "suggested_category": "Waterlogging | Roads | Waste | Streetlights | Drainage",
  "summary": "Concise 1-2 sentence executive summary of the issue and hazard",
  "priority": "Low | Medium | High | Critical",
  "priority_level": "low | medium | high | critical",
  "priority_explanation": "Clear reason for assigned priority based on safety/transit risk. Must conclude with: 'Citizen-reported; not independently verified.'",
  "evidence": ["Factual quote or observation 1 extracted directly from description", "Factual quote 2"],
  "duplicate_suggestions": [
    {{
      "incident_id": "CIV-XXXX",
      "incident_title": "Incident Title",
      "confidence": 0.85,
      "match_reason": "Specific rationale explaining location and issue overlap. Candidate for review; not auto-merged.",
      "meets_threshold": true
    }}
  ]
}}
Do not invent facts. Only use what the citizen reported.
"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.1,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.post(url, json=payload)
            if res.status_code != 200:
                logger.warning(f"Gemini API returned status {res.status_code}: {res.text[:200]}")
                return None

            data = res.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return None

            raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            parsed = json.loads(raw_text)

            # Validate duplicate suggestions structure
            duplicate_matches = []
            for d in parsed.get("duplicate_suggestions", []):
                conf = float(d.get("confidence", 0.0))
                duplicate_matches.append(DuplicateMatch(
                    incident_id=str(d.get("incident_id", "UNKNOWN")),
                    incident_title=str(d.get("incident_title", "")),
                    confidence=conf,
                    match_reason=str(d.get("match_reason", "")),
                    meets_threshold=bool(conf >= threshold),
                ))

            now_iso = datetime.now(timezone.utc).isoformat()
            priority_val = parsed.get("priority", "Medium")
            if priority_val not in ["Critical", "High", "Medium", "Low"]:
                priority_val = "Medium"

            return AnalysisResult(
                engine="gemini-1.5-flash",
                engine_name="Google Gemini 1.5 Flash AI",
                is_ai_powered=True,
                suggested_category=parsed.get("suggested_category", category or "Roads"),
                summary=parsed.get("summary", description[:100]),
                priority=priority_val,
                priority_level=priority_val.lower(),
                priority_explanation=parsed.get("priority_explanation", "Analyzed based on reported citizen description."),
                evidence=parsed.get("evidence", _extract_evidence_phrases(description)),
                duplicate_suggestions=duplicate_matches,
                analyzed_at=now_iso,
                notice="Citizen-reported; not independently verified.",
            )
    except Exception as e:
        logger.warning(f"Gemini API invocation failed ({e}); switching to rule-based fallback.")
        return None


async def analyze_report(
    category: str,
    description: str,
    location: str,
    incidents: List[Dict[str, Any]],
    threshold: Optional[float] = None,
) -> AnalysisResult:
    """
    Main entry point for report analysis.
    Attempts real AI (Gemini) if API key is present.
    Gracefully falls back to the deterministic rule-based engine if key is absent or call fails.
    """
    eff_threshold = threshold if threshold is not None else settings.duplicate_threshold
    ai_key = settings.active_ai_key

    if ai_key:
        ai_result = await run_gemini_analysis(
            api_key=ai_key,
            category=category,
            description=description,
            location=location,
            incidents=incidents,
            threshold=eff_threshold,
        )
        if ai_result:
            return ai_result

    # Fallback to rule-based engine
    return run_rule_based_analysis(
        category=category,
        description=description,
        location=location,
        incidents=incidents,
        threshold=eff_threshold,
    )


/**
 * CivicLens Frontend API Service
 * Connects React frontend to the FastAPI backend (http://localhost:8000/api).
 * Credentials stay on the backend; frontend makes standard CORS REST calls.
 */

const API_BASE = 'http://localhost:8000/api';

/**
 * Custom error class capturing backend HTTP status and details
 */
export class ApiError extends Error {
  constructor(message, status = 500, detail = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    throw new ApiError(
      'Unable to connect to CivicLens API server at ' + API_BASE + '. Please ensure the FastAPI backend is running on port 8000.',
      0,
      networkError.message
    );
  }

  if (!response.ok) {
    let errorDetail;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new ApiError(
      errorDetail || `API request failed with status ${response.status}`,
      response.status,
      errorDetail
    );
  }

  if (response.status === 204) return null;
  return response.json();
}

/**
 * Health check with database connectivity probe
 */
export async function checkApiHealth() {
  return request('/health');
}

/**
 * List reports from database with optional filters
 */
export async function getReports(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.incidentId) query.append('incident_id', params.incidentId);
  if (params.limit) query.append('limit', params.limit);
  if (params.offset) query.append('offset', params.offset);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return request(`/reports${qs}`);
}

/**
 * Retrieve a specific report by reference ID (e.g. SUB-D82A4F or REP-101)
 */
export async function getReportByRefId(refId) {
  if (!refId) throw new Error('Reference ID is required');
  return request(`/reports/${encodeURIComponent(refId)}`);
}

/**
 * Create a new citizen complaint report in Supabase database
 */
export async function createReport(payload) {
  const body = {
    category: payload.category,
    description: payload.description,
    location: payload.location,
    has_image: Boolean(payload.hasImage || payload.has_image),
    image_url: payload.imageUrl || payload.image_url || null,
    channel: payload.channel || 'Citizen Web Portal',
    ref_id: payload.refId || payload.ref_id || undefined,
    incident_id: payload.incidentId || payload.incident_id || null,
  };

  return request('/reports', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Retrieve incident clusters from database
 */
export async function getIncidents() {
  return request('/incidents');
}

/**
 * Trigger or refresh intelligence analysis for an existing report
 */
export async function analyzeReport(refId) {
  if (!refId) throw new Error('Reference ID is required');
  return request(`/reports/${encodeURIComponent(refId)}/analyze`, {
    method: 'POST',
  });
}

/**
 * Pre-screen and analyze draft complaint text before submission
 */
export async function analyzeDraft(draft) {
  return request('/reports/analyze-draft', {
    method: 'POST',
    body: JSON.stringify({
      category: draft.category || 'Roads',
      description: draft.description,
      location: draft.location || '',
    }),
  });
}

/**
 * Update incident status, assignment, and log officer note
 */
export async function updateIncident(incidentId, payload) {
  if (!incidentId) throw new Error('Incident ID is required');
  return request(`/incidents/${encodeURIComponent(incidentId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Link an unassigned citizen report to an incident cluster
 */
export async function linkReportToIncident(refId, incidentId) {
  if (!refId) throw new Error('Reference ID is required');
  return request(`/reports/${encodeURIComponent(refId)}/link`, {
    method: 'PATCH',
    body: JSON.stringify({ incident_id: incidentId }),
  });
}

/**
 * CivicLens App Context — Provider component.
 * Non-component exports (useApp, AppContext) are in appContextUtils.js
 * Connects frontend state with FastAPI / Supabase backend API.
 */
import { useState, useEffect, useCallback } from 'react';
import { AppContext } from './appContextUtils';
import {
  incidents as sampleIncidents,
  reports as sampleReports,
} from '../data/civicData';
import {
  createReport as apiCreateReport,
  getReports as apiGetReports,
  getReportByRefId as apiGetReportByRefId,
  analyzeReport as apiAnalyzeReport,
  getIncidents as apiGetIncidents,
  updateIncident as apiUpdateIncident,
  linkReportToIncident as apiLinkReportToIncident,
} from '../services/api';

function generateRefId() {
  const hex = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .toUpperCase()
    .padStart(6, '0');
  return `SUB-${hex}`;
}

function categoryToTheme(category) {
  const map = {
    Waterlogging: 'water',
    Roads: 'roads',
    Waste: 'waste',
    Streetlights: 'lighting',
    Drainage: 'water',
    'Road Safety': 'roads',
    'Waste Management': 'waste',
    'Street Lighting': 'lighting',
    'Water Supply': 'water',
  };
  return map[category] || 'roads';
}

function formatSubmittedAt(isoString) {
  if (!isoString) {
    const now = new Date();
    return `${now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })} at ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  }
  try {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr} at ${timeStr}`;
  } catch {
    return isoString;
  }
}

export function AppProvider({ children }) {
  const [incidents, setIncidents] = useState(sampleIncidents);
  const [submissions, setSubmissions] = useState([]);
  const [apiConnected, setApiConnected] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Load existing persisted reports and incidents from FastAPI / Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function loadPersistedData() {
      try {
        const [dbReports, dbIncidents] = await Promise.all([
          apiGetReports({ limit: 100 }),
          apiGetIncidents().catch(() => []),
        ]);

        if (!isMounted) return;
        setApiConnected(true);

        // Update incidents from database if available
        if (Array.isArray(dbIncidents) && dbIncidents.length > 0) {
          const mappedIncidents = dbIncidents.map((i) => ({
            id: i.id,
            incidentNumber: i.incident_number,
            category: i.category,
            categoryTheme: i.category_theme,
            title: i.title,
            location: i.location,
            priority: i.priority,
            priorityLevel: i.priority_level,
            status: i.status,
            statusLevel: i.status_level,
            assignedTo: i.assigned_to,
            isUrgent: i.is_urgent,
            zone: i.zone,
            intakeWindow: i.intake_window,
            clusterPattern: i.cluster_pattern,
            evidenceRiskTag: i.evidence_risk_tag,
            latitude: i.latitude,
            longitude: i.longitude,
            updates: i.updates || [],
          }));
          setIncidents(mappedIncidents);
        }

        // Filter for citizen submissions (unlinked or starting with SUB-)
        // that are not in the sample data (REP-101..REP-110)
        const sampleRefIds = new Set(sampleReports.map((r) => r.id));
        const citizenSubmissions = dbReports
          .filter(
            (r) =>
              !sampleRefIds.has(r.ref_id) &&
              (!r.incident_id || r.ref_id.startsWith('SUB-')),
          )
          .map((r) => ({
            refId: r.ref_id,
            category: r.category,
            categoryTheme: r.category_theme || categoryToTheme(r.category),
            description: r.description,
            location: r.location,
            hasImage: Boolean(r.has_image),
            imagePreviewUrl: r.image_url || null,
            status: r.status || 'Submitted',
            statusLevel: r.status_level || 'submitted',
            submittedAt: formatSubmittedAt(r.created_at),
            incidentId: r.incident_id || null,
            analysis: r.analysis || null,
            latitude: r.latitude,
            longitude: r.longitude,
            isDemo: false,
          }));

        setSubmissions(citizenSubmissions);
      } catch (err) {
        console.warn(
          'CivicLens API not reachable on mount; continuing with local state.',
          err.message,
        );
        setApiConnected(false);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    }

    loadPersistedData();
    return () => {
      isMounted = false;
    };
  }, []);

  async function submitReport({ category, description, location, imageFile }) {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dateStr = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const localSubmittedAt = `${dateStr} at ${timestamp}`;
    const localPreviewUrl = imageFile ? URL.createObjectURL(imageFile) : null;

    try {
      // Attempt backend persistence via FastAPI -> Supabase
      const created = await apiCreateReport({
        category,
        description,
        location,
        hasImage: Boolean(imageFile),
        channel: 'Citizen Web Portal',
      });

      const newSubmission = {
        refId: created.ref_id,
        category: created.category,
        categoryTheme: created.category_theme || categoryToTheme(created.category),
        description: created.description,
        location: created.location,
        hasImage: Boolean(imageFile || created.has_image),
        imagePreviewUrl: localPreviewUrl,
        status: created.status || 'Submitted',
        statusLevel: created.status_level || 'submitted',
        submittedAt: formatSubmittedAt(created.created_at),
        incidentId: created.incident_id || null,
        analysis: created.analysis || null,
        isDemo: false,
      };

      setSubmissions((prev) => [
        newSubmission,
        ...prev.filter((s) => s.refId !== newSubmission.refId),
      ]);
      setApiConnected(true);
      return newSubmission.refId;
    } catch (apiErr) {
      console.warn(
        'Backend submission failed or unreachable; saving in local session.',
        apiErr,
      );
      // Fallback so citizen reporting workflow does not freeze
      const refId = generateRefId();
      const fallbackSubmission = {
        refId,
        category,
        categoryTheme: categoryToTheme(category),
        description,
        location,
        hasImage: Boolean(imageFile),
        imagePreviewUrl: localPreviewUrl,
        status: 'Submitted',
        statusLevel: 'submitted',
        submittedAt: localSubmittedAt,
        incidentId: null,
        isDemo: true,
        apiError: apiErr.message,
      };

      setSubmissions((prev) => [fallbackSubmission, ...prev]);
      return refId;
    }
  }

  function getSubmission(refId) {
    return submissions.find((s) => s.refId === refId) || null;
  }

  const fetchSubmission = useCallback(
    async (refId) => {
      // 1. Check in-memory state
      const existing = submissions.find((s) => s.refId === refId);
      if (existing) return existing;

      // 2. Check sample reports
      const sample = sampleReports.find((r) => r.id === refId);
      if (sample) {
        return {
          refId: sample.id,
          category: 'Road Safety',
          categoryTheme: 'roads',
          description: sample.text,
          location: 'Bengaluru Urban',
          hasImage: false,
          imagePreviewUrl: null,
          status: 'Submitted',
          statusLevel: 'submitted',
          submittedAt: sample.timestamp,
          incidentId: sample.incidentId,
          isDemo: true,
        };
      }

      // 3. Attempt API fetch from Supabase
      try {
        const data = await apiGetReportByRefId(refId);
        const sub = {
          refId: data.ref_id,
          category: data.category,
          categoryTheme: data.category_theme || categoryToTheme(data.category),
          description: data.description,
          location: data.location,
          hasImage: Boolean(data.has_image),
          imagePreviewUrl: data.image_url || null,
          status: data.status || 'Submitted',
          statusLevel: data.status_level || 'submitted',
          submittedAt: formatSubmittedAt(data.created_at),
          incidentId: data.incident_id || null,
          analysis: data.analysis || null,
          isDemo: false,
        };
        setSubmissions((prev) => [
          sub,
          ...prev.filter((s) => s.refId !== sub.refId),
        ]);
        return sub;
      } catch {
        return null;
      }
    },
    [submissions],
  );

  const triggerAnalysis = useCallback(async (refId) => {
    try {
      const data = await apiAnalyzeReport(refId);
      const sub = {
        refId: data.ref_id,
        category: data.category,
        categoryTheme: data.category_theme || categoryToTheme(data.category),
        description: data.description,
        location: data.location,
        hasImage: Boolean(data.has_image),
        imagePreviewUrl: data.image_url || null,
        status: data.status || 'Submitted',
        statusLevel: data.status_level || 'submitted',
        submittedAt: formatSubmittedAt(data.created_at),
        incidentId: data.incident_id || null,
        analysis: data.analysis || null,
        isDemo: false,
      };
      setSubmissions((prev) => [
        sub,
        ...prev.filter((s) => s.refId !== sub.refId),
      ]);
      return sub;
    } catch (err) {
      console.error('Trigger analysis failed:', err);
      throw err;
    }
  }, []);

  const updateIncident = useCallback(async (incidentId, payload) => {
    try {
      const updated = await apiUpdateIncident(incidentId, payload);
      const mapped = {
        id: updated.id,
        incidentNumber: updated.incident_number,
        category: updated.category,
        categoryTheme: updated.category_theme,
        title: updated.title,
        location: updated.location,
        priority: updated.priority,
        priorityLevel: updated.priority_level,
        status: updated.status,
        statusLevel: updated.status_level,
        assignedTo: updated.assigned_to,
        isUrgent: updated.is_urgent,
        zone: updated.zone,
        intakeWindow: updated.intake_window,
        clusterPattern: updated.cluster_pattern,
        evidenceRiskTag: updated.evidence_risk_tag,
        latitude: updated.latitude,
        longitude: updated.longitude,
        updates: updated.updates || [],
      };
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === incidentId ? mapped : inc)),
      );
      return mapped;
    } catch (err) {
      console.error('Update incident failed:', err);
      // Local fallback update if offline
      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.id !== incidentId) return inc;
          const statusLevelMap = {
            open: 'open',
            acknowledged: 'review',
            'in progress': 'review',
            'under review': 'review',
            resolved: 'resolved',
          };
          const newStatus = payload.status || inc.status;
          return {
            ...inc,
            status: newStatus,
            statusLevel:
              statusLevelMap[newStatus.toLowerCase()] || inc.statusLevel,
            assignedTo:
              payload.assigned_to !== undefined
                ? payload.assigned_to
                : inc.assignedTo,
            updates: [
              ...(inc.updates || []),
              {
                id: `UPD-LOCAL`,
                timestamp: new Date().toISOString(),
                officer: payload.officer || 'Duty Officer',
                status: newStatus,
                assigned_to: payload.assigned_to,
                note: payload.note || 'Updated locally in session',
              },
            ],
          };
        }),
      );
      throw err;
    }
  }, []);

  const linkReport = useCallback(async (refId, incidentId) => {
    try {
      const updated = await apiLinkReportToIncident(refId, incidentId);
      setSubmissions((prev) =>
        prev.map((s) =>
          s.refId === refId
            ? { ...s, incidentId, status: 'Under Review', statusLevel: 'review' }
            : s,
        ),
      );
      return updated;
    } catch (err) {
      console.error('Link report failed:', err);
      setSubmissions((prev) =>
        prev.map((s) =>
          s.refId === refId
            ? { ...s, incidentId, status: 'Under Review', statusLevel: 'review' }
            : s,
        ),
      );
      throw err;
    }
  }, []);

  function getDashboardCounts() {
    return {
      totalReports: sampleReports.length + submissions.length,
      openIncidents: incidents.filter((i) => i.status === 'Open').length,
      urgentReview: incidents.filter((i) => i.priority === 'Critical' || i.isUrgent)
        .length,
      unassignedIncidents: incidents.filter(
        (i) => !i.assignedTo || i.status === 'Unassigned',
      ).length,
    };
  }

  const allReports = [
    ...sampleReports,
    ...submissions.map((s) => ({
      id: s.refId,
      incidentId: s.incidentId || null,
      text: s.description,
      timestamp: s.submittedAt,
      channel: 'Citizen Web Portal',
      verified: false,
      isPriorityEvidence: false,
      isSubmission: true,
      category: s.category,
      location: s.location,
      status: s.status,
      analysis: s.analysis || null,
    })),
  ];

  return (
    <AppContext.Provider
      value={{
        incidents,
        sampleIncidents: incidents,
        sampleReports,
        submissions,
        allReports,
        submitReport,
        getSubmission,
        fetchSubmission,
        triggerAnalysis,
        updateIncident,
        linkReport,
        getDashboardCounts,
        apiConnected,
        loadingInitial,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

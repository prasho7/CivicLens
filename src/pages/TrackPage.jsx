import { useState, useEffect } from 'react';
import { useApp } from '../context/appContextUtils';
import { navigate } from '../router/routerUtils';

const STATUS_LABELS = {
  Submitted: {
    level: 'submitted',
    description: 'Your report has been received and logged in the database. It is awaiting review by a municipal officer.',
  },
  'Under Review': {
    level: 'review',
    description: 'This report is currently being assessed by the assigned civic operations department.',
  },
  Open: {
    level: 'open',
    description: 'An operational incident has been opened and assigned for field inspection and resolution.',
  },
  Resolved: {
    level: 'resolved',
    description: 'The civic issue reported has been resolved by field teams.',
  },
};

function StatusBadge({ status, statusLevel }) {
  return (
    <span className={`cl-status-pill cl-state--${statusLevel || 'submitted'}`}>
      <span className="cl-indicator-dot" aria-hidden="true" />
      {status}
    </span>
  );
}

export default function TrackPage({ reportId }) {
  const { getSubmission, fetchSubmission, triggerAnalysis, incidents = [] } =
    useApp();
  const cachedSubmission = getSubmission(reportId);

  const [analyzing, setAnalyzing] = useState(false);
  const [fetchState, setFetchState] = useState({
    reportId: null,
    data: null,
    notFound: false,
  });

  const submission =
    cachedSubmission || (fetchState.reportId === reportId ? fetchState.data : null);
  const loading =
    !cachedSubmission && Boolean(reportId) && fetchState.reportId !== reportId;
  const notFound =
    !cachedSubmission &&
    (!reportId || (fetchState.reportId === reportId && fetchState.notFound));

  useEffect(() => {
    if (cachedSubmission || !reportId) {
      return;
    }

    let isCurrent = true;

    fetchSubmission(reportId)
      .then((result) => {
        if (!isCurrent) return;
        setFetchState({
          reportId,
          data: result,
          notFound: !result,
        });
      })
      .catch(() => {
        if (!isCurrent) return;
        setFetchState({
          reportId,
          data: null,
          notFound: true,
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [reportId, cachedSubmission, fetchSubmission]);

  // Loading state
  if (loading) {
    return (
      <main className="cl-main-workspace" id="main-content">
        <div className="cl-workspace-container">
          <header className="cl-page-header">
            <div className="cl-header-text-group">
              <h1 className="cl-page-title">Track Report</h1>
              <p className="cl-page-subtitle">Retrieving status for reference {reportId}…</p>
            </div>
          </header>
          <div className="cl-track-panel" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div className="cl-demo-beacon" style={{ display: 'inline-block', marginBottom: '1rem' }}>
              <span className="cl-demo-beacon-ring" />
              <span className="cl-demo-beacon-dot" />
            </div>
            <p className="cl-card-text">Connecting to database and fetching report details…</p>
          </div>
        </div>
      </main>
    );
  }

  // Not found state
  if (notFound || !submission) {
    return (
      <main className="cl-main-workspace" id="main-content">
        <div className="cl-workspace-container">
          <div className="cl-track-notfound">
            <div className="cl-notfound-icon" aria-hidden="true">🔍</div>
            <h1 className="cl-notfound-heading">Report Not Found</h1>
            <p className="cl-notfound-body">
              No submission matches reference ID{' '}
              <code className="cl-ref-inline">{reportId}</code>.
            </p>
            <p className="cl-notfound-hint">
              Please double check the reference ID or submit a new report. Persisted reports can be tracked across browser sessions.
            </p>
            <div className="cl-notfound-actions">
              <button
                type="button"
                className="cl-btn cl-btn--primary"
                onClick={() => navigate('/report')}
              >
                Submit a New Report
              </button>
              <button
                type="button"
                className="cl-btn cl-btn--ghost"
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const statusInfo = STATUS_LABELS[submission.status] || {
    level: submission.statusLevel || 'submitted',
    description: `Report status is ${submission.status}.`,
  };

  const linkedIncident = submission?.incidentId
    ? incidents.find((i) => i.id === submission.incidentId) || null
    : null;

  return (
    <main className="cl-main-workspace" id="main-content">
      <div className="cl-workspace-container">
        <header className="cl-page-header">
          <div className="cl-header-text-group">
            <h1 className="cl-page-title">Track Report</h1>
            <p className="cl-page-subtitle">Live status for your citizen submission.</p>
          </div>
          <div className="cl-header-meta">
            <div className="cl-intel-ref-badge">
              <span className="cl-ref-label">REF ID:</span>
              <span className="cl-ref-value">{submission.refId}</span>
            </div>
          </div>
        </header>

        <div className="cl-track-panel">
          {/* Status overview */}
          <div className="cl-track-status-section">
            <span className="cl-eyebrow">Current Status</span>
            <div className="cl-track-status-row">
              <StatusBadge status={submission.status} statusLevel={submission.statusLevel || statusInfo.level} />
              <p className="cl-track-status-desc">{statusInfo.description}</p>
            </div>
          </div>

          <div className="cl-intel-divider" />

          {/* Report details */}
          <div className="cl-track-details-grid">
            <div className="cl-track-detail-item">
              <span className="cl-attribute-label">Category</span>
              <span className="cl-attribute-value">{submission.category}</span>
            </div>

            <div className="cl-track-detail-item">
              <span className="cl-attribute-label">Submitted</span>
              <span className="cl-attribute-value">{submission.submittedAt}</span>
            </div>

            <div className="cl-track-detail-item cl-track-detail-full">
              <span className="cl-attribute-label">Location</span>
              <span className="cl-attribute-value">{submission.location}</span>
            </div>

            <div className="cl-track-detail-item cl-track-detail-full">
              <span className="cl-attribute-label">Description</span>
              <p className="cl-track-description">{submission.description}</p>
            </div>

            {submission.hasImage && (
              <div className="cl-track-detail-item cl-track-detail-full">
                <span className="cl-attribute-label">Photo</span>
                {submission.imagePreviewUrl ? (
                  <div className="cl-track-image-wrap">
                    <img
                      src={submission.imagePreviewUrl}
                      alt="Submitted photo preview"
                      className="cl-track-image"
                    />
                    <p className="cl-track-image-note">
                      Local preview only — image binary not persisted to object storage in this phase.
                    </p>
                  </div>
                ) : (
                  <span className="cl-attribute-value">Photo attached with submission</span>
                )}
              </div>
            )}
          </div>

          {/* Municipal Incident Linkage Status (Phase 5 Act) */}
          <div className="cl-intel-divider" />
          <div className="cl-linkage-section" style={{ padding: '4px 0' }}>
            <span className="cl-eyebrow">Municipal Incident Linkage</span>
            {submission.incidentId ? (
              <div
                className="cl-intake-review-card"
                style={{
                  backgroundColor: '#f0fdf4',
                  borderColor: '#bbf7d0',
                  marginTop: '8px',
                }}
              >
                <div className="cl-intake-review-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="cl-duplicate-incident-ref" style={{ color: '#16a34a' }}>
                      {submission.incidentId}
                    </span>
                    <strong style={{ fontSize: '0.9rem', color: '#166534' }}>
                      Linked to Operational Incident Cluster
                    </strong>
                  </div>
                  <span
                    className={`cl-status-pill cl-state--${
                      linkedIncident?.statusLevel || 'review'
                    }`}
                  >
                    {linkedIncident?.status || 'Active'}
                  </span>
                </div>
                {linkedIncident && (
                  <div style={{ fontSize: '0.84rem', color: '#14532d', lineHeight: 1.5 }}>
                    <div>
                      <strong>Incident Title:</strong> {linkedIncident.title}
                    </div>
                    <div>
                      <strong>Assigned Unit:</strong>{' '}
                      {linkedIncident.assignedTo || 'Pending Unit Routing'}
                    </div>
                    {linkedIncident.updates && linkedIncident.updates.length > 0 && (
                      <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#166534' }}>
                        Latest field update:{' '}
                        <em>&ldquo;{linkedIncident.updates[linkedIncident.updates.length - 1].note}&rdquo;</em>
                      </div>
                    )}
                  </div>
                )}
                <p
                  className="cl-verification-description"
                  style={{ fontSize: '0.75rem', margin: '4px 0 0 0', color: '#15803d' }}
                >
                  Notice: Citizen report is corroborated with incident {submission.incidentId}.
                </p>
              </div>
            ) : (
              <div
                className="cl-ai-notice"
                style={{
                  backgroundColor: '#fffbeb',
                  borderColor: '#fde68a',
                  marginTop: '8px',
                }}
                role="status"
              >
                <span className="cl-ai-notice-icon" aria-hidden="true">
                  ⏳
                </span>
                <div>
                  <strong style={{ color: '#92400e' }}>
                    Status: Pending Incident Linkage (Intake Queue)
                  </strong>
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      fontSize: '0.82rem',
                      color: '#78350f',
                    }}
                  >
                    This citizen complaint is safely recorded in the intake queue.
                    It has not yet been linked to a triaged operational incident
                    cluster. Municipal officers review the intake queue to group
                    related reports into incident tickets.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="cl-intel-divider" />

          {/* Intelligence Analysis Section */}
          {submission.analysis ? (
            <div className="cl-analysis-card" aria-label="Intelligence Analysis">
              <div className="cl-analysis-header">
                <div className="cl-analysis-title-group">
                  <span className="cl-eyebrow">Intelligence Assessment</span>
                </div>
                <span
                  className={`cl-engine-tag ${
                    submission.analysis.is_ai_powered
                      ? 'cl-engine-ai'
                      : 'cl-engine-heuristic'
                  }`}
                >
                  {submission.analysis.engine_name ||
                    (submission.analysis.is_ai_powered
                      ? 'AI · Google Gemini'
                      : 'Rule-Based Engine (Heuristic Fallback)')}
                </span>
              </div>

              <div className="cl-analysis-grid">
                {/* Summary */}
                <div className="cl-analysis-block cl-analysis-block--full">
                  <span className="cl-analysis-label">Executive Summary</span>
                  <p className="cl-analysis-summary">{submission.analysis.summary}</p>
                </div>

                {/* Priority */}
                <div className="cl-analysis-block">
                  <span className="cl-analysis-label">Priority Assessment</span>
                  <div className="cl-priority-row">
                    <span
                      className={`cl-status-pill cl-priority--${
                        submission.analysis.priority_level || 'medium'
                      }`}
                    >
                      <span className="cl-indicator-dot" aria-hidden="true" />
                      {submission.analysis.priority}
                    </span>
                    <p className="cl-priority-exp">
                      {submission.analysis.priority_explanation}
                    </p>
                  </div>
                </div>

                {/* Suggested Category */}
                <div className="cl-analysis-block">
                  <span className="cl-analysis-label">Suggested Category</span>
                  <span className="cl-attribute-value">
                    {submission.analysis.suggested_category}
                    {submission.analysis.suggested_category !== submission.category && (
                      <span
                        className="cl-form-hint"
                        style={{ display: 'block', marginTop: '2px' }}
                      >
                        (User selected: {submission.category})
                      </span>
                    )}
                  </span>
                </div>

                {/* Extracted Evidence */}
                {submission.analysis.evidence &&
                  submission.analysis.evidence.length > 0 && (
                    <div className="cl-analysis-block cl-analysis-block--full">
                      <span className="cl-analysis-label">
                        Extracted Factual Evidence
                      </span>
                      <div className="cl-evidence-chips">
                        {submission.analysis.evidence.map((ev, i) => (
                          <div key={i} className="cl-evidence-chip">
                            &ldquo;{ev}&rdquo;
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Duplicate Suggestions */}
                <div className="cl-analysis-block cl-analysis-block--full">
                  <span className="cl-analysis-label">
                    Duplicate Incident Screening (For Officer Review)
                  </span>
                  {submission.analysis.duplicate_suggestions &&
                  submission.analysis.duplicate_suggestions.length > 0 ? (
                    <div className="cl-duplicates-container">
                      {submission.analysis.duplicate_suggestions.map((dup) => (
                        <div key={dup.incident_id} className="cl-duplicate-item">
                          <div className="cl-duplicate-item-header">
                            <div>
                              <span className="cl-duplicate-incident-ref">
                                {dup.incident_id}
                              </span>
                              {' · '}
                              <span className="cl-duplicate-incident-title">
                                {dup.incident_title}
                              </span>
                            </div>
                            <span
                              className={`cl-confidence-badge ${
                                dup.confidence >= 0.8
                                  ? 'cl-confidence-badge--high'
                                  : ''
                              }`}
                            >
                              {Math.round(dup.confidence * 100)}% Match
                            </span>
                          </div>
                          <p className="cl-duplicate-reason">{dup.match_reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="cl-no-duplicates">
                      No candidate duplicate incidents found. Report appears to represent an independent issue.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="cl-ai-notice" role="note">
              <span className="cl-ai-notice-icon" aria-hidden="true">⚙</span>
              <div style={{ flex: 1 }}>
                <strong>Intelligence analysis not yet run for this report.</strong>
                <p style={{ margin: '4px 0 8px 0', fontSize: '0.8rem' }}>
                  Analyze category, priority, evidence, and duplicate incident candidates.
                </p>
                <button
                  type="button"
                  className="cl-btn cl-btn--secondary"
                  style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                  onClick={async () => {
                    setAnalyzing(true);
                    try {
                      await triggerAnalysis(submission.refId);
                    } catch (err) {
                      console.error('Analysis failed:', err);
                    } finally {
                      setAnalyzing(false);
                    }
                  }}
                  disabled={analyzing}
                >
                  {analyzing ? 'Analyzing Report…' : 'Run Intelligence Analysis'}
                </button>
              </div>
            </div>
          )}

          {/* Verification notice — exact required text */}
          <div className="cl-verification-notice" role="note" aria-label="Verification notice">
            <div className="cl-verification-header">
              <span className="cl-verification-badge-text">Verification Status</span>
            </div>
            <p className="cl-verification-description">
              Citizen-reported; not independently verified.
            </p>
          </div>

          <div className="cl-track-actions">
            <button
              type="button"
              className="cl-btn cl-btn--secondary"
              onClick={() => navigate('/report')}
            >
              Submit Another Report
            </button>
            <button
              type="button"
              className="cl-btn cl-btn--ghost"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

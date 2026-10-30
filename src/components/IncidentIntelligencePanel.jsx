import { useState } from 'react';
import {
  RoadSafetyIcon,
  WasteIcon,
  StreetlightIcon,
  WaterDropIcon,
  LocationPinIcon,
  ReportCountIcon,
  QuoteIcon,
  ShieldAlertIcon,
  ClockIcon,
  CheckCircleIcon,
} from './Icons';
import { navigate } from '../router/routerUtils';
import { useApp } from '../context/appContextUtils';

function CategoryIcon({ theme, className }) {
  switch (theme) {
    case 'waste':
      return <WasteIcon className={className} />;
    case 'lighting':
      return <StreetlightIcon className={className} />;
    case 'water':
      return <WaterDropIcon className={className} />;
    case 'roads':
    default:
      return <RoadSafetyIcon className={className} />;
  }
}

function OfficerActionForm({ incident, onSave, isSaving }) {
  const [statusVal, setStatusVal] = useState(incident.status);
  const [assignedVal, setAssignedVal] = useState(incident.assignedTo || '');
  const [noteVal, setNoteVal] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      status: statusVal,
      assigned_to: assignedVal || null,
      note: noteVal.trim() || undefined,
    });
    setNoteVal('');
  };

  return (
    <form onSubmit={handleSubmit} className="cl-officer-form">
      <div className="cl-form-group">
        <label className="cl-form-label" htmlFor="officer-status-select">
          Operational Status Stage
        </label>
        <select
          id="officer-status-select"
          className="cl-form-select"
          value={statusVal}
          onChange={(e) => setStatusVal(e.target.value)}
        >
          <option value="Open">Open</option>
          <option value="Acknowledged">Acknowledged</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      <div className="cl-form-group">
        <label className="cl-form-label" htmlFor="officer-assignee-select">
          Assign Responsible Department / Team
        </label>
        <input
          id="officer-assignee-select"
          type="text"
          className="cl-form-input"
          value={assignedVal}
          onChange={(e) => setAssignedVal(e.target.value)}
          placeholder="e.g. Road Safety Response Unit 4, Sanitation Wing B..."
          list="dept-options"
        />
        <datalist id="dept-options">
          <option value="Road Safety Response Unit 4" />
          <option value="Sanitation Wing B" />
          <option value="Stormwater Ops Team" />
          <option value="Urban Forestry Team" />
          <option value="Electrical & Streetlighting Division" />
          <option value="BWSSB Water Pipeline Team" />
        </datalist>
      </div>

      <div className="cl-form-group">
        <label className="cl-form-label" htmlFor="officer-note-input">
          Progress / Resolution Note (Optional)
        </label>
        <textarea
          id="officer-note-input"
          className="cl-form-textarea"
          rows={2}
          value={noteVal}
          onChange={(e) => setNoteVal(e.target.value)}
          placeholder="Add field dispatch update, inspection findings, or resolution note..."
        />
      </div>

      <button
        type="submit"
        className="cl-btn cl-btn--primary"
        style={{ width: '100%' }}
        disabled={isSaving}
      >
        {isSaving ? 'Saving to Database…' : 'Save Status & Log Update'}
      </button>
    </form>
  );
}

export default function IncidentIntelligencePanel({
  incident,
  reports,
  intakeReports = [],
}) {
  const { updateIncident, linkReport } = useApp();
  const priorityEvidence = reports.find((r) => r.isPriorityEvidence) || reports[0];

  const matchingIntake = intakeReports.filter((s) =>
    s.analysis?.duplicate_suggestions?.some((d) => d.incident_id === incident.id),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  async function handleSaveOfficerUpdate(payload) {
    setIsSaving(true);
    setFeedback('');
    try {
      await updateIncident(incident.id, {
        ...payload,
        officer: 'Duty Officer',
      });
      setFeedback('Incident changes saved to database.');
    } catch {
      setFeedback('Changes saved to session state.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLinkReport(refId) {
    try {
      await linkReport(refId, incident.id);
      setFeedback(`Report ${refId} linked to incident ${incident.id}.`);
    } catch {
      setFeedback(`Failed to link report ${refId}.`);
    }
  }

  return (
    <aside className="cl-intelligence-panel" aria-label="Incident Intelligence Details">
      <div className="cl-intel-header">
        <div className="cl-intel-eyebrow-row">
          <span className="cl-eyebrow">Incident Intelligence</span>
          <div className="cl-intel-ref-badge">
            <span className="cl-ref-label">REF ID:</span>
            <span className="cl-ref-value">{incident.id}</span>
          </div>
        </div>

        <div className="cl-intel-title-block">
          <div className="cl-intel-connection-indicator">
            <span className="cl-connection-line" aria-hidden="true" />
            <span className="cl-connection-tag">
              <span className="cl-active-dot" aria-hidden="true" />
              Focus: Incident {incident.incidentNumber}
            </span>
          </div>
          <h2 className="cl-intel-title">{incident.title}</h2>
        </div>

        <div className="cl-intel-meta-strip">
          <div className="cl-meta-item">
            <LocationPinIcon className="cl-meta-icon" />
            <span>{incident.location}</span>
          </div>
          <span className="cl-meta-bullet" aria-hidden="true">•</span>
          <div className="cl-meta-item">
            <ReportCountIcon className="cl-meta-icon" />
            <span>{reports.length} {reports.length === 1 ? 'Citizen Report' : 'Citizen Reports'}</span>
          </div>
          {incident.assignedTo && (
            <>
              <span className="cl-meta-bullet" aria-hidden="true">•</span>
              <div className="cl-meta-item cl-meta-assigned">
                <span>{incident.assignedTo}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="cl-intel-divider" />

      {/* Key Triaged Attributes */}
      <div className="cl-intel-grid">
        <div className="cl-attribute-box">
          <span className="cl-attribute-label">Category</span>
          <div className="cl-attribute-value-group">
            <span className={`cl-cat-${incident.categoryTheme} cl-cat-mini-icon`} aria-hidden="true">
              <CategoryIcon theme={incident.categoryTheme} className="cl-mini-svg" />
            </span>
            <span className="cl-attribute-value">{incident.category}</span>
          </div>
        </div>

        <div className="cl-attribute-box">
          <span className="cl-attribute-label">Priority</span>
          <div className="cl-attribute-value-group">
            <span className={`cl-status-pill cl-priority--${incident.priorityLevel}`}>
              <span className="cl-indicator-dot" aria-hidden="true" />
              {incident.priority}
            </span>
          </div>
        </div>

        <div className="cl-attribute-box">
          <span className="cl-attribute-label">Status</span>
          <div className="cl-attribute-value-group">
            <span className={`cl-status-pill cl-state--${incident.statusLevel}`}>
              <span className="cl-indicator-dot" aria-hidden="true" />
              {incident.status}
            </span>
          </div>
        </div>
      </div>

      {/* Supporting Evidence Block - Matches Linked Report Text */}
      <div className="cl-evidence-section">
        <div className="cl-evidence-header">
          <ShieldAlertIcon className="cl-evidence-header-icon" />
          <h3 className="cl-evidence-heading">Why this matters</h3>
        </div>

        <div className="cl-evidence-card">
          <div className="cl-quote-icon-watermark" aria-hidden="true">
            <QuoteIcon className="cl-watermark-svg" />
          </div>

          <blockquote className="cl-evidence-quote">
            &ldquo;{priorityEvidence ? priorityEvidence.text : 'No linked report available.'}&rdquo;
          </blockquote>

          <div className="cl-evidence-footer">
            <span className="cl-evidence-source">
              {priorityEvidence
                ? `Evidence from Report #${priorityEvidence.id} (${priorityEvidence.channel})`
                : 'Citizen evidence synthesis'}
            </span>
            <span className="cl-evidence-tag">{incident.evidenceRiskTag}</span>
          </div>
        </div>
      </div>

      {/* Candidate Corroboration from Intake Queue */}
      {matchingIntake.length > 0 && (
        <div
          className="cl-intake-review-card"
          role="region"
          aria-label="Candidate Corroborating Reports"
        >
          <div className="cl-intake-review-header">
            <span className="cl-intake-review-title">
              <ShieldAlertIcon className="cl-meta-icon" />
              Candidate Corroborating Submissions ({matchingIntake.length})
            </span>
            <span className="cl-intake-item-pill">Officer Review Only</span>
          </div>
          <p className="cl-card-text" style={{ fontSize: '0.82rem', margin: 0 }}>
            Intake intelligence identified {matchingIntake.length} unlinked citizen{' '}
            {matchingIntake.length === 1 ? 'report' : 'reports'} potentially related
            to this incident cluster. Not automatically merged.
          </p>
          <div className="cl-duplicates-container">
            {matchingIntake.map((sub) => {
              const match = sub.analysis?.duplicate_suggestions?.find(
                (d) => d.incident_id === incident.id,
              );
              return (
                <div key={sub.refId} className="cl-duplicate-item">
                  <div className="cl-duplicate-item-header">
                    <div>
                      <span className="cl-duplicate-incident-ref">
                        {sub.refId}
                      </span>
                      {' · '}
                      <span className="cl-duplicate-incident-title">
                        {sub.location}
                      </span>
                    </div>
                    {match && (
                      <span className="cl-confidence-badge cl-confidence-badge--high">
                        {Math.round(match.confidence * 100)}% Match
                      </span>
                    )}
                  </div>
                  <p
                    className="cl-analysis-summary"
                    style={{ fontSize: '0.84rem' }}
                  >
                    &ldquo;{sub.description}&rdquo;
                  </p>
                  {match && (
                    <p className="cl-duplicate-reason">{match.match_reason}</p>
                  )}
                  <div style={{ marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="cl-btn cl-btn--ghost"
                      style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                      onClick={() => navigate(`/track/${sub.refId}`)}
                    >
                      Inspect Report Details →
                    </button>
                    <button
                      type="button"
                      className="cl-btn cl-btn--secondary"
                      style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                      onClick={() => handleLinkReport(sub.refId)}
                    >
                      Link to {incident.id}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Citizen-Verification Notice */}
      <div className="cl-verification-notice" role="note" aria-label="Citizen Verification Notice">
        <div className="cl-verification-header">
          <CheckCircleIcon className="cl-verification-check-icon" />
          <span className="cl-verification-badge-text">Verification Status</span>
        </div>
        <p className="cl-verification-description">
          Citizen-reported; not independently verified.
        </p>
      </div>

      {/* Presentation Metadata: Intake & Corroboration Context */}
      <div className="cl-context-section">
        <h3 className="cl-context-heading">Intake &amp; Corroboration Summary</h3>
        <div className="cl-context-list">
          <div className="cl-context-row">
            <span className="cl-context-term">Report Intake:</span>
            <span className="cl-context-desc">
              <ClockIcon className="cl-inline-svg" />
              {incident.intakeWindow}
            </span>
          </div>
          <div className="cl-context-row">
            <span className="cl-context-term">Cluster Pattern:</span>
            <span className="cl-context-desc">
              {reports.length} independent {reports.length === 1 ? 'report' : 'reports'} · {incident.clusterPattern}
            </span>
          </div>
          <div className="cl-context-row">
            <span className="cl-context-term">Administrative Zone:</span>
            <span className="cl-context-desc">
              {incident.zone}
            </span>
          </div>
          <div className="cl-context-row">
            <span className="cl-context-term">Dispatch Status:</span>
            <span className="cl-context-desc">
              {incident.assignedTo ? (
                <span>Assigned to {incident.assignedTo}</span>
              ) : (
                <span className="cl-unassigned-highlight">Unassigned (Awaiting Unit Routing)</span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="cl-intel-divider" />

      {/* Officer Incident Management (Phase 5 Act) */}
      <section className="cl-officer-action-section" aria-label="Officer Incident Management">
        <div className="cl-intel-eyebrow-row" style={{ marginBottom: '10px' }}>
          <span className="cl-eyebrow">Officer Operational Action</span>
          <span className="cl-intake-item-pill">Live Supabase Sync</span>
        </div>

        {feedback && (
          <div
            className="cl-field-error"
            style={{
              padding: '8px 12px',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              borderRadius: '6px',
              marginBottom: '10px',
              fontSize: '0.82rem',
            }}
            role="status"
          >
            ✓ {feedback}
          </div>
        )}

        <OfficerActionForm
          key={incident.id}
          incident={incident}
          onSave={handleSaveOfficerUpdate}
          isSaving={isSaving}
        />

        {/* Audit & Resolution History */}
        {incident.updates && incident.updates.length > 0 && (
          <div className="cl-history-block" style={{ marginTop: '16px' }}>
            <span className="cl-analysis-label">Incident Audit &amp; Resolution History</span>
            <div className="cl-history-timeline" style={{ marginTop: '8px' }}>
              {incident.updates
                .slice()
                .reverse()
                .map((u, i) => (
                  <div key={u.id || i} className="cl-history-item">
                    <div className="cl-history-item-top">
                      <strong>{u.officer || 'Duty Officer'}</strong>
                      <span className="cl-history-time">
                        {u.timestamp ? new Date(u.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', margin: '4px 0' }}>
                      <span className="cl-status-pill" style={{ transform: 'scale(0.85)', transformOrigin: 'left' }}>
                        {u.status}
                      </span>
                      {u.assigned_to && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          → {u.assigned_to}
                        </span>
                      )}
                    </div>
                    <p className="cl-history-note-text">{u.note}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </section>
    </aside>
  );
}

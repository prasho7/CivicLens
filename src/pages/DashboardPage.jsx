import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import SummaryCards from '../components/SummaryCards';
import IncidentFeed from '../components/IncidentFeed';
import IncidentIntelligencePanel from '../components/IncidentIntelligencePanel';
import IncidentMap from '../components/IncidentMap';
import CivicIntelligence from '../components/CivicIntelligence';
import { useApp } from '../context/appContextUtils';
import { navigate } from '../router/routerUtils';

export default function DashboardPage() {
  const { sampleIncidents, sampleReports, submissions, getDashboardCounts } =
    useApp();

  const [selectedIncidentId, setSelectedIncidentId] = useState(
    sampleIncidents[0].id,
  );
  const [showIntakeQueue, setShowIntakeQueue] = useState(false);
  const [activeView, setActiveView] = useState('operations'); // 'operations', 'map', 'intelligence'

  const summaryCounts = getDashboardCounts();

  const selectedIncident =
    sampleIncidents.find((i) => i.id === selectedIncidentId) ||
    sampleIncidents[0];
  const selectedReports = sampleReports.filter(
    (r) => r.incidentId === selectedIncident.id,
  );

  return (
    <main className="cl-main-workspace" id="main-content">
      <div className="cl-workspace-container">
        <PageHeader />

        <SummaryCards counts={summaryCounts} />

        {/* Citizen submissions banner — shown when submissions exist */}
        {submissions.length > 0 && (
          <div
            className="cl-submissions-banner"
            role="status"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="cl-submissions-icon" aria-hidden="true">
                📋
              </span>
              <span>
                <strong>
                  {submissions.length} citizen{' '}
                  {submissions.length === 1 ? 'submission' : 'submissions'}
                </strong>{' '}
                recorded in database intake queue — pending municipal incident linkage.
              </span>
            </div>
            <button
              type="button"
              className="cl-btn cl-btn--secondary"
              style={{ padding: '4px 12px', fontSize: '0.78rem' }}
              onClick={() => setShowIntakeQueue((prev) => !prev)}
            >
              {showIntakeQueue ? 'Hide Intake Queue' : 'Review Intake Queue'}
            </button>
          </div>
        )}

        {/* Expanded Intake Queue Intelligence & Duplicate Review Drawer */}
        {showIntakeQueue && submissions.length > 0 && (
          <div className="cl-analysis-card" style={{ marginBottom: '20px' }}>
            <div className="cl-analysis-header">
              <div className="cl-analysis-title-group">
                <span className="cl-eyebrow">
                  Intake Queue Intelligence &amp; Candidate Duplicates
                </span>
              </div>
              <span className="cl-intake-item-pill">
                {submissions.length} Pending Review
              </span>
            </div>
            <div className="cl-duplicates-container">
              {submissions.map((sub) => (
                <div key={sub.refId} className="cl-duplicate-item">
                  <div className="cl-duplicate-item-header">
                    <div>
                      <span className="cl-duplicate-incident-ref">
                        {sub.refId}
                      </span>
                      {' · '}
                      <strong>{sub.category}</strong>
                      {' at '}
                      <span>{sub.location}</span>
                    </div>
                    {sub.analysis?.priority && (
                      <span
                        className={`cl-status-pill cl-priority--${
                          sub.analysis.priority_level || 'medium'
                        }`}
                      >
                        {sub.analysis.priority}
                      </span>
                    )}
                  </div>
                  <p
                    className="cl-analysis-summary"
                    style={{ fontSize: '0.86rem' }}
                  >
                    {sub.description}
                  </p>
                  {sub.analysis?.duplicate_suggestions &&
                    sub.analysis.duplicate_suggestions.length > 0 && (
                      <div style={{ marginTop: '6px' }}>
                        <span
                          className="cl-analysis-label"
                          style={{ fontSize: '0.72rem' }}
                        >
                          Candidate Duplicate Matches (Officer Review Only):
                        </span>
                        {sub.analysis.duplicate_suggestions.map((dup) => (
                          <div
                            key={dup.incident_id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              marginTop: '4px',
                              padding: '4px 8px',
                              backgroundColor: 'var(--slate-50)',
                              borderRadius: '4px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <span className="cl-duplicate-incident-ref">
                                {dup.incident_id}
                              </span>
                              <span style={{ fontSize: '0.82rem' }}>
                                {dup.incident_title}
                              </span>
                              <span className="cl-confidence-badge">
                                {Math.round(dup.confidence * 100)}% Match
                              </span>
                            </div>
                            <button
                              type="button"
                              className="cl-btn cl-btn--ghost"
                              style={{ padding: '2px 8px', fontSize: '0.74rem' }}
                              onClick={() => {
                                setSelectedIncidentId(dup.incident_id);
                                document
                                  .querySelector('.cl-workspace-grid')
                                  ?.scrollIntoView({ behavior: 'smooth' });
                              }}
                            >
                              Focus Incident →
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      className="cl-btn cl-btn--ghost"
                      style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                      onClick={() => navigate(`/track/${sub.refId}`)}
                    >
                      Track Full Report →
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p
              className="cl-verification-description"
              style={{ fontSize: '0.75rem', margin: 0 }}
            >
              Notice: Citizen-reported; not independently verified. Candidate
              duplicates shown for officer review only — records are not
              automatically merged.
            </p>
          </div>
        )}

        {/* Workspace View Switcher Tabs (Phase 4 & 5) */}
        <div
          className="cl-workspace-tabs"
          role="tablist"
          aria-label="Dashboard Workspace Views"
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'operations'}
            className={`cl-btn ${
              activeView === 'operations' ? 'cl-btn--primary' : 'cl-btn--secondary'
            }`}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            onClick={() => setActiveView('operations')}
          >
            📋 Incident Operations
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'map'}
            className={`cl-btn ${
              activeView === 'map' ? 'cl-btn--primary' : 'cl-btn--secondary'
            }`}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            onClick={() => setActiveView('map')}
          >
            🗺️ Geographic Incident Map
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'intelligence'}
            className={`cl-btn ${
              activeView === 'intelligence'
                ? 'cl-btn--primary'
                : 'cl-btn--secondary'
            }`}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            onClick={() => setActiveView('intelligence')}
          >
            📊 Civic Intelligence &amp; Concentrations
          </button>
        </div>

        {activeView === 'operations' && (
          <section
            className="cl-workspace-grid"
            aria-label="Incident Management Workspace"
          >
            <IncidentFeed
              incidents={sampleIncidents}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={setSelectedIncidentId}
              reports={sampleReports}
            />
            <IncidentIntelligencePanel
              incident={selectedIncident}
              reports={selectedReports}
              intakeReports={submissions}
            />
          </section>
        )}

        {activeView === 'map' && (
          <IncidentMap
            incidents={sampleIncidents}
            reports={sampleReports}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={(id) => {
              setSelectedIncidentId(id);
              setActiveView('operations');
            }}
          />
        )}

        {activeView === 'intelligence' && (
          <CivicIntelligence
            incidents={sampleIncidents}
            reports={sampleReports}
            submissions={submissions}
          />
        )}
      </div>
    </main>
  );
}

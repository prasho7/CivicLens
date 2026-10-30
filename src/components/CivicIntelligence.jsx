import { ShieldAlertIcon, LocationPinIcon, ReportCountIcon } from './Icons';

export default function CivicIntelligence({
  incidents = [],
  reports = [],
  submissions = [],
}) {
  const allCitizenReports = [
    ...reports,
    ...submissions.map((s) => ({
      id: s.refId,
      category: s.category,
      location: s.location,
      priority: s.analysis?.priority || 'Submitted',
    })),
  ];

  // 1. Most frequently reported issue categories (Citizen Reports)
  const categoryCounts = allCitizenReports.reduce((acc, r) => {
    const cat = r.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const totalReportsCount = allCitizenReports.length;

  // 2. Geographic concentrations (Corridors / Neighborhoods)
  const areaMap = {};
  incidents.forEach((inc) => {
    const loc = inc.location?.split(',')[0]?.trim() || inc.location || 'Unknown Area';
    if (!areaMap[loc]) {
      areaMap[loc] = { area: loc, incidents: [], reportsCount: 0 };
    }
    areaMap[loc].incidents.push(inc);
  });

  allCitizenReports.forEach((r) => {
    const loc = r.location?.split(',')[0]?.trim() || r.location || 'Unknown Area';
    // Match against existing area key if substring matches
    const matchedKey = Object.keys(areaMap).find(
      (k) => loc.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(loc.toLowerCase()),
    );
    if (matchedKey) {
      areaMap[matchedKey].reportsCount += 1;
    } else {
      if (!areaMap[loc]) {
        areaMap[loc] = { area: loc, incidents: [], reportsCount: 0 };
      }
      areaMap[loc].reportsCount += 1;
    }
  });

  const concentrations = Object.values(areaMap)
    .filter((a) => a.incidents.length > 0 || a.reportsCount > 0)
    .sort((a, b) => (b.incidents.length * 2 + b.reportsCount) - (a.incidents.length * 2 + a.reportsCount));

  // 3. High-Priority Incidents
  const highPriorityList = incidents.filter(
    (i) => i.priority === 'Critical' || i.priority === 'High' || i.isUrgent,
  );

  return (
    <div className="cl-intelligence-view">
      {/* Top Banner: Distinguish Incidents vs Reports */}
      <div className="cl-intel-distinction-banner" role="region" aria-label="Entity Distinction Overview">
        <div className="cl-distinction-item">
          <span className="cl-distinction-label">Municipal Incidents</span>
          <span className="cl-distinction-value">{incidents.length}</span>
          <span className="cl-distinction-hint">
            Clustered problem tickets managed by municipal teams
          </span>
        </div>
        <div className="cl-distinction-divider" aria-hidden="true" />
        <div className="cl-distinction-item">
          <span className="cl-distinction-label">Total Citizen Reports</span>
          <span className="cl-distinction-value">{totalReportsCount}</span>
          <span className="cl-distinction-hint">
            Individual citizen complaints &amp; intake submissions
          </span>
        </div>
        <div className="cl-distinction-divider" aria-hidden="true" />
        <div className="cl-distinction-item">
          <span className="cl-distinction-label">Pending Intake Queue</span>
          <span className="cl-distinction-value">{submissions.length}</span>
          <span className="cl-distinction-hint">
            Unlinked citizen submissions awaiting officer linkage
          </span>
        </div>
      </div>

      <div className="cl-intel-sections-grid">
        {/* Section 1: Issue Category Concentration */}
        <div className="cl-intel-card">
          <div className="cl-intel-card-header">
            <ReportCountIcon className="cl-meta-icon" />
            <h3 className="cl-intel-card-title">Recurring Complaint Categories</h3>
          </div>
          <p className="cl-card-text" style={{ fontSize: '0.82rem', marginBottom: '14px' }}>
            Frequency of civic concerns reported by citizens across the web portal and mobile channels.
          </p>

          {sortedCategories.length > 0 ? (
            <div className="cl-category-bars">
              {sortedCategories.map(([cat, count]) => {
                const pct = Math.round((count / Math.max(1, totalReportsCount)) * 100);
                return (
                  <div key={cat} className="cl-category-bar-row">
                    <div className="cl-bar-label-group">
                      <span className="cl-bar-name">{cat}</span>
                      <span className="cl-bar-count">
                        <strong>{count}</strong> {count === 1 ? 'report' : 'reports'} ({pct}%)
                      </span>
                    </div>
                    <div className="cl-bar-track">
                      <div
                        className="cl-bar-fill"
                        style={{ width: `${Math.min(100, Math.max(8, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="cl-empty-state-notice">
              No complaint reports recorded yet to identify category frequencies.
            </div>
          )}
        </div>

        {/* Section 2: Geographic Concentrations */}
        <div className="cl-intel-card">
          <div className="cl-intel-card-header">
            <LocationPinIcon className="cl-meta-icon" />
            <h3 className="cl-intel-card-title">Geographic Hotspots &amp; Corridors</h3>
          </div>
          <p className="cl-card-text" style={{ fontSize: '0.82rem', marginBottom: '14px' }}>
            Areas experiencing clustered civic infrastructure issues and multiple reports.
          </p>

          {concentrations.length > 0 ? (
            <div className="cl-concentration-list">
              {concentrations.map((area) => (
                <div key={area.area} className="cl-concentration-item">
                  <div className="cl-concentration-header">
                    <span className="cl-concentration-title">{area.area}</span>
                    <span className="cl-intake-item-pill">
                      {area.incidents.length} {area.incidents.length === 1 ? 'Incident' : 'Incidents'} · {area.reportsCount} {area.reportsCount === 1 ? 'Report' : 'Reports'}
                    </span>
                  </div>
                  {area.incidents.length > 0 && (
                    <div className="cl-concentration-incidents">
                      {area.incidents.map((inc) => (
                        <div key={inc.id} className="cl-mini-incident-chip">
                          <span className="cl-duplicate-incident-ref">{inc.id}</span>
                          <span style={{ fontSize: '0.8rem' }}>{inc.title}</span>
                          <span className={`cl-status-pill cl-priority--${inc.priorityLevel || 'medium'}`} style={{ transform: 'scale(0.85)' }}>
                            {inc.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="cl-empty-state-notice">
              Insufficient geographic data to determine issue concentrations.
            </div>
          )}
        </div>

        {/* Section 3: High Priority & Critical Incidents */}
        <div className="cl-intel-card cl-intel-card--full">
          <div className="cl-intel-card-header">
            <ShieldAlertIcon className="cl-meta-icon" style={{ color: '#ef4444' }} />
            <h3 className="cl-intel-card-title">High-Priority &amp; Urgent Operational Incidents</h3>
          </div>
          <p className="cl-card-text" style={{ fontSize: '0.82rem', marginBottom: '14px' }}>
            Municipal incidents flagged for acute pedestrian/transit safety hazard or urgent review.
          </p>

          {highPriorityList.length > 0 ? (
            <div className="cl-high-priority-grid">
              {highPriorityList.map((inc) => (
                <div key={inc.id} className="cl-priority-item-card">
                  <div className="cl-priority-item-top">
                    <div>
                      <span className="cl-duplicate-incident-ref">{inc.id}</span>
                      <strong style={{ marginLeft: '8px', fontSize: '0.9rem' }}>{inc.title}</strong>
                    </div>
                    <span className={`cl-status-pill cl-priority--${inc.priorityLevel || 'critical'}`}>
                      {inc.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                    📍 {inc.location} · {inc.category}
                  </div>
                  <p className="cl-evidence-quote" style={{ margin: '8px 0', fontSize: '0.8rem' }}>
                    &ldquo;{inc.clusterPattern || inc.title}&rdquo;
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#475569' }}>
                    <span>
                      <strong>Status:</strong> {inc.status}
                    </span>
                    <span>
                      {inc.assignedTo ? `Assigned to ${inc.assignedTo}` : '⚠️ Unassigned'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="cl-empty-state-notice">
              No high-priority or critical incidents active at this time.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


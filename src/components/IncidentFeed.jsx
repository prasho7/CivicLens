import {
  RoadSafetyIcon,
  WasteIcon,
  StreetlightIcon,
  WaterDropIcon,
  LocationPinIcon,
  ReportCountIcon,
} from './Icons';

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

export default function IncidentFeed({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  reports,
}) {
  return (
    <section className="cl-feed-panel" aria-label="Incident Feed">
      <div className="cl-section-header">
        <div className="cl-section-title-wrap">
          <span className="cl-eyebrow">Incident Feed</span>
          <h2 className="cl-section-heading">Active Civic Queue</h2>
        </div>
        <span className="cl-feed-counter" aria-label={`${incidents.length} incidents displayed`}>
          {incidents.length} Incidents
        </span>
      </div>

      <div className="cl-incident-list">
        {incidents.map((incident) => {
          const isSelected = incident.id === selectedIncidentId;
          const linkedCount = reports.filter((r) => r.incidentId === incident.id).length;

          return (
            <article
              key={incident.id}
              className={`cl-incident-card ${
                isSelected ? 'cl-incident-card--selected' : ''
              }`}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => onSelectIncident(incident.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectIncident(incident.id);
                }
              }}
            >
              {isSelected && (
                <div className="cl-card-selected-bar" aria-hidden="true" />
              )}

              <div className="cl-incident-card-header">
                <div className="cl-incident-category-badge">
                  <span className={`cl-category-icon-wrap cl-cat-${incident.categoryTheme}`} aria-hidden="true">
                    <CategoryIcon theme={incident.categoryTheme} className="cl-category-svg" />
                  </span>
                  <span className="cl-category-name">{incident.category}</span>
                </div>

                <div className="cl-incident-id-group">
                  <span className="cl-incident-num">Incident {incident.incidentNumber}</span>
                  {isSelected && (
                    <span className="cl-active-view-pill">
                      <span className="cl-active-dot" aria-hidden="true" />
                      Active in Panel
                    </span>
                  )}
                </div>
              </div>

              <div className="cl-incident-card-body">
                <h3 className="cl-incident-title">{incident.title}</h3>

                <div className="cl-incident-location">
                  <LocationPinIcon className="cl-location-icon" />
                  <span className="cl-location-text">{incident.location}</span>
                </div>
              </div>

              <div className="cl-incident-card-footer">
                <div className="cl-incident-tags">
                  <span className={`cl-status-pill cl-priority--${incident.priorityLevel}`}>
                    <span className="cl-indicator-dot" aria-hidden="true" />
                    {incident.priority}
                  </span>

                  <span className={`cl-status-pill cl-state--${incident.statusLevel}`}>
                    <span className="cl-indicator-dot" aria-hidden="true" />
                    {incident.status}
                  </span>

                  {!incident.assignedTo && (
                    <span className="cl-status-pill cl-state--unassigned">
                      Unassigned
                    </span>
                  )}
                </div>

                <div className="cl-report-count-badge" title={`${linkedCount} citizen reports linked`}>
                  <ReportCountIcon className="cl-report-svg" />
                  <span className="cl-report-num">{linkedCount}</span>
                  <span className="cl-report-label">{linkedCount === 1 ? 'Report' : 'Reports'}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

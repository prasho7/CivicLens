import { ReportStackIcon, PulseIcon, AlertTriangleIcon, UsersQueueIcon } from './Icons';

export default function SummaryCards({ counts }) {
  const cards = [
    {
      id: 'total-reports',
      label: 'Total Reports',
      value: counts.totalReports.toString(),
      context: 'Aggregated intake across channels',
      variant: 'default',
      icon: ReportStackIcon,
      iconTheme: 'teal',
      badge: null,
    },
    {
      id: 'open-incidents',
      label: 'Open Incidents',
      value: counts.openIncidents.toString(),
      context: 'In active municipal triage',
      variant: 'default',
      icon: PulseIcon,
      iconTheme: 'blue',
      badge: null,
    },
    {
      id: 'urgent-review',
      label: 'Urgent Review',
      value: counts.urgentReview.toString(),
      context: 'Requires immediate safety triage',
      variant: 'urgent',
      icon: AlertTriangleIcon,
      iconTheme: 'crimson',
      badge: 'Action Required',
    },
    {
      id: 'unassigned-incidents',
      label: 'Unassigned Incidents',
      value: counts.unassignedIncidents.toString(),
      context: 'Pending department dispatch',
      variant: 'unassigned',
      icon: UsersQueueIcon,
      iconTheme: 'amber',
      badge: 'Pending Route',
    },
  ];

  return (
    <section className="cl-summary-grid" aria-label="Key Performance Indicators">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            className={`cl-summary-card cl-summary-card--${card.variant}`}
            tabIndex={0}
          >
            <div className="cl-summary-header">
              <span className="cl-summary-label">{card.label}</span>
              <div className={`cl-summary-icon-wrap cl-summary-icon--${card.iconTheme}`} aria-hidden="true">
                <IconComponent className="cl-summary-svg" />
              </div>
            </div>

            <div className="cl-summary-body">
              <div className="cl-summary-value-row">
                <span className="cl-summary-value">{card.value}</span>
                {card.badge && (
                  <span className={`cl-summary-tag cl-summary-tag--${card.variant}`}>
                    {card.badge}
                  </span>
                )}
              </div>
              <p className="cl-summary-context">{card.context}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

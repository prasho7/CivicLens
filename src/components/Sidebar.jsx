import { LogoIcon, OverviewIcon, ReportStackIcon } from './Icons';
import { NavLink } from '../router/hashRouter';
import { navigate } from '../router/routerUtils';

export default function Sidebar({ currentPath }) {
  return (
    <aside className="cl-sidebar" aria-label="Main Navigation">
      {/* Brand Header */}
      <div className="cl-sidebar-brand">
        <div
          className="cl-brand-container"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}
          onKeyDown={(e) => { if (e.key === 'Enter') navigate('/dashboard'); }}
          role="link"
          tabIndex={0}
          aria-label="CivicLens home"
        >
          <div className="cl-brand-mark" aria-hidden="true">
            <LogoIcon className="cl-brand-svg" />
          </div>
          <div className="cl-brand-text">
            <div className="cl-wordmark">
              <span className="cl-wordmark-primary">Civic</span>
              <span className="cl-wordmark-accent">Lens</span>
            </div>
            <p className="cl-brand-descriptor">Civic Intelligence Platform</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="cl-sidebar-nav-section">
        <div className="cl-nav-label">Workspace</div>
        <nav className="cl-nav-list" aria-label="Primary navigation">
          <NavLink
            to="/dashboard"
            currentPath={currentPath}
            className="cl-nav-item cl-nav-link"
            activeClass="cl-nav-item--active"
          >
            <span className="cl-nav-active-indicator" aria-hidden="true" />
            <span className="cl-nav-icon-wrap" aria-hidden="true">
              <OverviewIcon className="cl-nav-icon" />
            </span>
            <span className="cl-nav-label-text">Overview</span>
            <span className="cl-nav-active-pill">Live</span>
          </NavLink>

          <NavLink
            to="/report"
            currentPath={currentPath}
            className="cl-nav-item cl-nav-link"
            activeClass="cl-nav-item--active"
          >
            <span className="cl-nav-active-indicator" aria-hidden="true" />
            <span className="cl-nav-icon-wrap" aria-hidden="true">
              <ReportStackIcon className="cl-nav-icon" />
            </span>
            <span className="cl-nav-label-text">Submit Report</span>
          </NavLink>
        </nav>
      </div>

      {/* Subtle Divider & Bottom Branding */}
      <div className="cl-sidebar-footer">
        <div className="cl-sidebar-divider" />
        <div className="cl-system-status">
          <div className="cl-status-pulse-container" aria-hidden="true">
            <span className="cl-status-dot-ping" />
            <span className="cl-status-dot-core" />
          </div>
          <div className="cl-status-info">
            <span className="cl-status-title">Municipal Ops Hub</span>
            <span className="cl-status-meta">Demonstration v1.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

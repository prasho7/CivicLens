export default function PageHeader() {
  return (
    <header className="cl-page-header">
      <div className="cl-header-text-group">
        <h1 className="cl-page-title">Civic Operations</h1>
        <p className="cl-page-subtitle">Turn citizen reports into coordinated action.</p>
      </div>

      <div className="cl-header-meta">
        <div className="cl-demo-badge" role="status" aria-label="Environment: Demonstration with synthetic data">
          <span className="cl-demo-beacon" aria-hidden="true">
            <span className="cl-demo-beacon-ring" />
            <span className="cl-demo-beacon-dot" />
          </span>
          <span className="cl-demo-badge-text">DEMO · SYNTHETIC DATA</span>
        </div>
      </div>
    </header>
  );
}


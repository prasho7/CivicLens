import { navigate } from '../router/routerUtils';

export default function NotFoundPage({ path }) {
  return (
    <main className="cl-main-workspace" id="main-content">
      <div className="cl-workspace-container">
        <div className="cl-track-notfound">
          <div className="cl-notfound-icon" aria-hidden="true">404</div>
          <h1 className="cl-notfound-heading">Page Not Found</h1>
          <p className="cl-notfound-body">
            The path <code className="cl-ref-inline">{path || '(unknown)'}</code> does not exist.
          </p>
          <div className="cl-notfound-actions">
            <button
              type="button"
              className="cl-btn cl-btn--primary"
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

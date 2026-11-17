import { Link } from 'react-router-dom';

/**
 * Friendly full-width error panel. Used for 404, "can't reach the server",
 * "no access" and unexpected render errors.
 */
const PRESETS = {
  notfound: { code: '404', icon: 'fa-compass', title: 'Page not found', text: 'The page you are looking for has moved, been deleted, or never existed. Let us get you back on track.' },
  server: { code: '503', icon: 'fa-plug', title: "We can't reach the server", text: 'The VJTI Committee Manager API is not responding. Check that the backend is running, then try again.' },
  forbidden: { code: '403', icon: 'fa-lock', title: 'You do not have access', text: 'This area is only available to the right role or committee. Sign in with a different account to continue.' },
  crash: { code: 'Oops', icon: 'fa-bug', title: 'Something went wrong', text: 'An unexpected error stopped this page from loading. Your data is safe — reloading usually fixes it.' },
};

export default function ErrorState({ kind = 'notfound', title, text, onRetry, detail }) {
  const p = PRESETS[kind] || PRESETS.notfound;
  return (
    <div className="main-content">
      <div className="error-page">
        <div className="error-code" aria-hidden="true">
          {p.code === '404' || p.code === '403' || p.code === '503'
            ? <>{p.code[0]}<i className={`fas ${p.icon}`}></i>{p.code[2]}</>
            : <>{p.code}</>}
        </div>
        <h1 className="error-title">{title || p.title}</h1>
        <p className="error-text">{text || p.text}</p>
        {detail && <pre className="error-detail">{detail}</pre>}
        <div className="error-actions">
          {onRetry && (
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              <i className="fas fa-redo"></i> Try again
            </button>
          )}
          <Link to="/" className="btn btn-outline"><i className="fas fa-home"></i> Back to home</Link>
          <Link to="/dashboard" className="btn btn-outline"><i className="fas fa-tachometer-alt"></i> Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

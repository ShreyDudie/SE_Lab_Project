/**
 * Lightweight skeleton loader. Replaces bare "Loading..." text with a
 * shimmering placeholder shaped like the page that is about to appear.
 * variant: 'page' (default) | 'dashboard' | 'committee' (dark universe)
 */
export default function Skeleton({ variant = 'page' }) {
  if (variant === 'dashboard') {
    return (
      <div className="main-content" aria-busy="true" aria-label="Loading">
        <div className="skeleton skeleton-line" style={{ width: '18%', height: 14 }}></div>
        <div className="skeleton skeleton-line" style={{ width: '34%', height: 34 }}></div>
        <div className="stats-row" style={{ marginTop: '1.5rem' }}>
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 118 }}></div>)}
        </div>
        <div className="skeleton skeleton-line" style={{ width: '26%' }}></div>
        <div className="card-grid">
          {[0, 1, 2].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 190 }}></div>)}
        </div>
      </div>
    );
  }
  if (variant === 'committee') {
    return (
      <div className="main-content skeleton-dark" aria-busy="true" aria-label="Loading">
        <div className="skeleton skeleton-hero" style={{ height: 300 }}></div>
        <div className="committee-grid-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="skeleton" style={{ height: 260 }}></div>
          <div className="skeleton" style={{ height: 260 }}></div>
        </div>
        <div className="card-grid">
          {[0, 1, 2].map(i => <div key={i} className="skeleton skeleton-card"></div>)}
        </div>
      </div>
    );
  }
  return (
    <div className="main-content" aria-busy="true" aria-label="Loading">
      <div className="skeleton skeleton-hero"></div>
      <div className="skeleton skeleton-line" style={{ width: '40%' }}></div>
      <div className="card-grid">
        {[0, 1, 2].map(i => <div key={i} className="skeleton skeleton-card"></div>)}
      </div>
    </div>
  );
}

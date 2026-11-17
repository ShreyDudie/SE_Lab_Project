/**
 * Full-screen branded splash used while the app checks the session.
 * Pulsing crest, wordmark and an indeterminate gold progress bar.
 */
export default function BrandedLoader({ message = 'Loading your campus hub' }) {
  return (
    <div className="splash" role="status" aria-live="polite" aria-label={message}>
      <div className="splash-orbs" aria-hidden="true"><span></span><span></span><span></span></div>
      <div className="splash-inner">
        <div className="splash-crest">
          <img src="/favicon.svg" alt="" width="84" height="84" />
          <span className="splash-ring"></span>
        </div>
        <div className="splash-brand">VJTI <span>Committee Manager</span></div>
        <div className="splash-bar"><i></i></div>
        <p className="splash-msg">{message}&hellip;</p>
      </div>
    </div>
  );
}

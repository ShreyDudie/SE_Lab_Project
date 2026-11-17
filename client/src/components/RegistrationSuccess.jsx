import { useEffect } from 'react';
import { getCommitteeAccent } from '../utils/committeeThemes';
import { playSound } from '../utils/sound';

/**
 * "Thank you" state shown right after a successful registration.
 * Animated checkmark, confetti burst, and clear next steps.
 */
export default function RegistrationSuccess({ show, event, onClose, onViewTicket }) {
  // chime once, when the card opens (not on every parent re-render)
  useEffect(() => { if (show) playSound('success'); }, [show]);

  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, onClose]);

  if (!show || !event) return null;
  const accent = getCommitteeAccent(event.committee_name);
  const when = new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="modal-backdrop confirm-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="thanks-card" role="dialog" aria-modal="true" aria-labelledby="thanks-title" style={{ '--accent': accent }} onClick={e => e.stopPropagation()}>
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => <i key={i} style={{ '--i': i }}></i>)}
        </div>
        <div className="thanks-check">
          <svg viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="24" fill="none" />
            <path d="M14 27l8 8 16-17" fill="none" />
          </svg>
        </div>
        <h3 id="thanks-title">You&rsquo;re in! Thank you for registering.</h3>
        <p className="thanks-event">{event.title}</p>
        <p className="thanks-meta">
          <i className="far fa-calendar-alt"></i> {when}
          {event.start_time ? <> &middot; <i className="far fa-clock"></i> {event.start_time}</> : null}
        </p>
        <p className="thanks-note">We&rsquo;ve added this to your schedule. Watch your notifications for updates from the {event.committee_name} team.</p>
        <div className="thanks-actions">
          {onViewTicket && (
            <button type="button" className="btn btn-primary" onClick={onViewTicket}>
              <i className="fas fa-ticket-alt"></i> View my ticket
            </button>
          )}
          <button type="button" className="btn btn-outline" onClick={onClose}>Keep exploring</button>
        </div>
      </div>
    </div>
  );
}

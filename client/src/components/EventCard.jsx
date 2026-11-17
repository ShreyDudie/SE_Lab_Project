import { useState } from 'react';
import CountdownTimer from './CountdownTimer';
import EventDetailsModal from './EventDetailsModal';
import { useFlash } from './FlashMessage';
import { getCommitteeAccent } from '../utils/committeeThemes';

export default function EventCard({ event, actionLabel, onAction, disabled, secondaryLabel, onSecondary }) {
  const [showDetails, setShowDetails] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const flash = useFlash();

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const tags = event.tags ? event.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const isUpcoming = event.date && !event.is_completed && new Date(event.date + 'T23:59:59') >= new Date();
  const accent = getCommitteeAccent(event.committee_name);

  const handleBookmark = (e) => {
    e.stopPropagation();
    setBookmarked(b => !b);
    flash(bookmarked ? 'Bookmark removed.' : 'Event bookmarked successfully!', 'success');
  };

  const handleShare = (e) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(window.location.host + '/?event=' + event.id);
    } catch { /* clipboard unavailable */ }
    flash('Event link copied to clipboard!', 'success');
  };

  const open = () => setShowDetails(true);
  const onKey = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  };

  return (
    <>
      <div
        className="ev-card card-hover-lift"
        style={{ '--accent': accent }}
        onClick={open}
        onKeyDown={onKey}
        role="button"
        tabIndex={0}
        aria-label={`${event.title} — view details`}
      >
        <div className="ev-card-bar"></div>

        <div className="ev-card-top">
          <span className="ev-chip">
            <i className="fas fa-shield-alt"></i>
            {event.committee_name}
          </span>
          {event.is_completed
            ? <span className="badge badge-muted" style={{ fontWeight: 600 }}>Completed</span>
            : <span className="ev-open"><span className="ev-open-dot"></span>Open</span>
          }
        </div>

        <h3 className="ev-title">{event.title}</h3>

        <div className="ev-meta">
          <span><i className="fas fa-calendar-alt"></i> {formatDate(event.date)}</span>
          {event.start_time && (
            <span><i className="far fa-clock"></i> {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}</span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="ev-tags">
            {tags.slice(0, 3).map(tag => <span key={tag} className="ev-tag">{tag}</span>)}
          </div>
        )}

        <p className="ev-desc">
          {event.details && event.details.length > 80 ? event.details.substring(0, 80) + '...' : event.details || 'Click to view event details and rules.'}
        </p>

        {typeof event.registration_count === 'number' && event.registration_count > 0 && (
          <div className="ev-reg-count"><i className="fas fa-user-friends"></i> {event.registration_count} registered</div>
        )}

        {/* Countdown for upcoming events */}
        {isUpcoming && (
          <div style={{ margin: '0.75rem 0 0.25rem 0' }}>
            <CountdownTimer date={event.date} startTime={event.start_time} />
          </div>
        )}

        <div className="ev-footer">
          <div className="gap-row">
            {actionLabel && (
              <button className="btn btn-primary btn-sm ev-action" onClick={(e) => { e.stopPropagation(); onAction(); }} disabled={disabled}>
                <i className={`fas ${disabled ? 'fa-check' : 'fa-bolt'}`} style={{ fontSize: '0.8rem' }}></i> {actionLabel}
              </button>
            )}
          </div>

          <div className="gap-row">
            <button className={`ev-icon-btn ${bookmarked ? 'active' : ''}`} onClick={handleBookmark} title="Bookmark Event" aria-label="Bookmark event" aria-pressed={bookmarked}>
              <i className={`${bookmarked ? 'fas' : 'far'} fa-bookmark`}></i>
            </button>
            <button className="ev-icon-btn" onClick={handleShare} title="Share Link" aria-label="Copy event link">
              <i className="fas fa-share-alt"></i>
            </button>
          </div>
        </div>
      </div>

      <EventDetailsModal
        show={showDetails}
        onClose={() => setShowDetails(false)}
        event={event}
        onRegister={onAction}
        isRegistered={disabled}
      />
    </>
  );
}

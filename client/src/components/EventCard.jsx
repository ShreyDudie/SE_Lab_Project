import { useState } from 'react';
import CountdownTimer from './CountdownTimer';
import EventDetailsModal from './EventDetailsModal';
import { useFlash } from './FlashMessage';

export default function EventCard({ event, actionLabel, onAction, disabled, secondaryLabel, onSecondary }) {
  const [showDetails, setShowDetails] = useState(false);
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

  const handleBookmark = (e) => {
    e.stopPropagation();
    flash('Event bookmarked successfully!', 'success');
  };

  const handleShare = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.host + '/?event=' + event.id);
    flash('Event link copied to clipboard!', 'success');
  };

  return (
    <>
      <div className="card card-hover-lift" style={{ 
        cursor: 'pointer', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        color: '#FFFFFF'
      }} onClick={() => setShowDetails(true)}>
        
        <div style={{ marginBottom: '1rem' }}>
          <span className="badge badge-navy" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFFFFF', fontWeight: 700 }}>
            <i className="fas fa-shield-alt" style={{ marginRight: '6px' }}></i>
            {event.committee_name}
          </span>
        </div>

        <div className="flex-between mb-1">
          <div className="gap-row" style={{ fontSize: '0.85rem', color: '#F1F5F9', fontWeight: 600 }}>
            <i className="fas fa-calendar-alt" style={{ fontSize: '0.75rem', color: '#CBD5E1' }}></i>
            {formatDate(event.date)}
          </div>
          {event.is_completed
            ? <span className="badge badge-muted" style={{ fontWeight: 600 }}>Completed</span>
            : <span className="badge badge-success" style={{ background: 'var(--success)', color: '#fff', border: 'none', fontWeight: 600 }}>Open</span>
          }
        </div>
        <h3 style={{ marginTop: '0.5rem', marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          {event.title}
        </h3>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                padding: '0.2rem 0.5rem',
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#F8FAFC',
                borderRadius: '4px'
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <p style={{ fontSize: '0.9rem', color: '#E2E8F0', marginBottom: 'auto', lineHeight: '1.6', flexGrow: 1, fontWeight: 500 }}>
          {event.details && event.details.length > 80 ? event.details.substring(0, 80) + '...' : event.details || 'Click to view event details and rules.'}
        </p>

        {/* Countdown for upcoming events */}
        {isUpcoming && (
          <div style={{ margin: '1rem 0 0.5rem 0' }}>
            <CountdownTimer date={event.date} startTime={event.start_time} />
          </div>
        )}

        <div className="flex-between" style={{ marginTop: '1rem', borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '1rem' }}>
          <div className="gap-row">
            {actionLabel && (
              <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); onAction(); }} disabled={disabled}
                style={{ transition: 'all 0.25s', position: 'relative', overflow: 'hidden', fontWeight: 700 }}>
                <i className="fas fa-bolt" style={{ fontSize: '0.65rem' }}></i> {actionLabel}
              </button>
            )}
          </div>
          
          <div className="gap-row">
            <button className="btn btn-sm" style={{ padding: '0.4rem', color: '#F1F5F9', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} onClick={handleBookmark} title="Bookmark Event">
              <i className="far fa-bookmark"></i>
            </button>
            <button className="btn btn-sm" style={{ padding: '0.4rem', color: '#F1F5F9', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} onClick={handleShare} title="Share Link">
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

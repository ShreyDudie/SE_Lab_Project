export default function EventCard({ event, actionLabel, onAction, disabled, secondaryLabel, onSecondary }) {
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

  return (
    <div className="card">
      <div className="flex-between mb-1">
        <span className="badge badge-navy">{event.committee_name}</span>
        {event.is_completed
          ? <span className="badge badge-muted">Completed</span>
          : <span className="badge badge-success">Open</span>
        }
      </div>
      <h3 style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>{event.title}</h3>
      <div className="gap-row" style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.75rem' }}>
        <i className="fas fa-calendar-alt" style={{ fontSize: '0.7rem' }}></i>
        {formatDate(event.date)}
        <span style={{ margin: '0 0.25rem', color: 'var(--border)' }}>|</span>
        <i className="fas fa-clock" style={{ fontSize: '0.7rem' }}></i>
        {formatTime(event.start_time)}
      </div>
      {event.details && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: '0.75rem', lineHeight: '1.5' }}>
          {event.details.length > 120 ? event.details.substring(0, 120) + '...' : event.details}
        </p>
      )}
      <div className="gap-row">
        {actionLabel && (
          <button className="btn btn-primary btn-sm" onClick={onAction} disabled={disabled}>
            {actionLabel}
          </button>
        )}
        {secondaryLabel && (
          <button className="btn btn-outline btn-sm" onClick={onSecondary}>
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

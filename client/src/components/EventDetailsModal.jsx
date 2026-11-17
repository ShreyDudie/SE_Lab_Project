import CountdownTimer from './CountdownTimer';

export default function EventDetailsModal({ show, onClose, event, onRegister, isRegistered }) {
  if (!show || !event) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="modal-content event-landing-modal section-reveal" onClick={e => e.stopPropagation()} style={{ 
        maxWidth: '900px', 
        padding: 0, 
        overflow: 'hidden', 
        background: 'rgba(15, 20, 30, 0.95)', 
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
        color: '#F8FAFC'
      }}>
        
        {/* Hero Header */}
        <div className="event-landing-hero" style={{ 
          background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.4))', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: '3rem 2rem', 
          position: 'relative' 
        }}>
          <button className="btn btn-sm btn-outline" onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', color: '#FFF', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }}>
            <i className="fas fa-times"></i>
          </button>
          <div className="flex-between mb-1" style={{ position: 'relative', zIndex: 2 }}>
            <span className="badge badge-navy" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#FFF' }}><i className="fas fa-university"></i> {event.committee_name || 'VJTI Event'}</span>
            {event.is_completed ? <span className="badge badge-muted" style={{ fontWeight: 700 }}>Completed</span> : <span className="badge badge-success" style={{ background: 'var(--success)', border: 'none', color: '#FFF', fontWeight: 800 }}>Registrations Open</span>}
          </div>
          
          <h1 style={{ fontSize: '2.5rem', color: '#FFFFFF', margin: '0.5rem 0 1rem', textShadow: '0 2px 10px rgba(0,0,0,0.8)', fontWeight: 800 }}>
            {event.title}
          </h1>
          
          <div className="gap-row" style={{ color: '#CBD5E1', fontSize: '0.95rem', marginBottom: '1.5rem', fontWeight: 500 }}>
            <span><i className="fas fa-calendar-alt" style={{ color: '#94A3B8' }}></i> {formatDate(event.date)}</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>|</span>
            <span><i className="fas fa-clock" style={{ color: '#94A3B8' }}></i> {formatTime(event.start_time)} to {formatTime(event.end_time || 'Late')}</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>|</span>
            <span><i className="fas fa-map-marker-alt" style={{ color: '#94A3B8' }}></i> VJTI Main Campus</span>
          </div>
          
          <div className="gap-row align-items-center">
            {onRegister && !event.is_completed && (
              isRegistered ? (
                <button className="btn btn-success" disabled style={{ opacity: 0.8, color: '#FFF', fontWeight: 700, padding: '0.6rem 1.2rem', boxShadow: 'none' }}>
                  <i className="fas fa-check-circle"></i> You are Registered
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => { onRegister(event.id); onClose(); }} style={{ fontWeight: 800, padding: '0.6rem 1.2rem', boxShadow: '0 4px 12px rgba(59,130,246,0.4)', background: '#3B82F6', border: 'none', color: '#FFF' }}>
                  <i className="fas fa-bolt"></i> Register for Event
                </button>
              )
            )}
          </div>
        </div>

        {/* Body Content */}
        <div style={{ padding: '2.5rem', display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '3rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#FFFFFF', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', fontWeight: 700 }}>
              <i className="fas fa-info-circle" style={{ color: '#60A5FA', marginRight: '8px' }}></i> About The Event
            </h3>
            <p style={{ color: '#E2E8F0', lineHeight: '1.7', marginBottom: '2rem', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
              {event.details || 'No extended description provided for this event. Prepare yourself for an amazing experience!'}
            </p>

            <h3 style={{ marginBottom: '1rem', color: '#FFFFFF', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', fontWeight: 700 }}>
              <i className="fas fa-clipboard-list" style={{ color: '#60A5FA', marginRight: '8px' }}></i> Rules &amp; Eligibility
            </h3>
            <ul style={{ color: '#E2E8F0', lineHeight: '1.7', paddingLeft: '1.2rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Open to all registered university students.</li>
              <li style={{ marginBottom: '0.5rem' }}>Valid College ID card is mandatory for entry.</li>
              <li style={{ marginBottom: '0.5rem' }}>Punctuality is critical; late arrivals may be penalized or disqualified.</li>
              <li style={{ marginBottom: '0.5rem' }}>Standard college code of conduct applies.</li>
            </ul>
          </div>
          
          <div>
            <div className="card" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', marginBottom: '1.5rem', borderRadius: '12px' }}>
              <h4 style={{ marginBottom: '1rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-trophy" style={{ color: '#FCD34D' }}></i> Prizes &amp; Rewards
              </h4>
              <ul style={{ color: '#CBD5E1', paddingLeft: '1.2rem', fontSize: '0.93rem', lineHeight: '1.7' }}>
                <li style={{ marginBottom: '0.4rem' }}><strong style={{ color: '#FFFFFF' }}>1st Place:</strong> Certificates + 10 Dept Points</li>
                <li style={{ marginBottom: '0.4rem' }}><strong style={{ color: '#FFFFFF' }}>2nd Place:</strong> Certificates + 5 Dept Points</li>
                <li style={{ marginBottom: '0.4rem' }}><strong style={{ color: '#FFFFFF' }}>3rd Place:</strong> Certificates + 3 Dept Points</li>
                <li>Participation certificates for all attendees.</li>
              </ul>
            </div>

            {tags.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.84rem', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '0.75rem', letterSpacing: '0.05em', fontWeight: 800 }}>Tags</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {tags.map(tag => (
                    <span key={tag} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#F1F5F9', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.84rem', fontWeight: 600 }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {isUpcoming && (
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ fontSize: '0.84rem', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '0.25rem', letterSpacing: '0.05em', fontWeight: 800 }}>Time Remaining</h4>
                <CountdownTimer date={event.date} startTime={event.start_time} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

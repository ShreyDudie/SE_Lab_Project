import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../components/FlashMessage';
import EventCard from '../components/EventCard';
import SearchBar from '../components/SearchBar';
import CommitteeLogo from '../components/CommitteeLogo';
import { getCommitteeTheme, getThemeCSSVars } from '../utils/committeeThemes';

export default function IndexPage() {
  const { user } = useAuth();
  const flash = useFlash();
  const [data, setData] = useState({ committees: [], upcoming: [], recommended: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [filteredUpcoming, setFilteredUpcoming] = useState(null);

  useEffect(() => {
    fetch('/api/index', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleRegister = async (eventId) => {
    const res = await fetch(`/api/register_event/${eventId}`, { method: 'POST', credentials: 'include' });
    const d = await res.json();
    if (res.ok) {
      flash(d.message, 'success');
    } else {
      flash(d.error || d.message, 'error');
    }
  };

  const displayedUpcoming = filteredUpcoming !== null ? filteredUpcoming : data.upcoming;

  if (loading) {
    return <div className="main-content text-center"><p className="text-muted mt-3">Loading...</p></div>;
  }

  return (
    <div className="main-content">
      {/* ═══ Immersive Hero ═══ */}
      <div className="index-hero section-reveal">
        <h1>VJTI Events <span className="hero-accent">&amp;</span> Committees</h1>
        <p className="page-sub">
          The central hub for every committee at VJTI. Explore events, register, and build your legacy.
        </p>
      </div>

      {/* ═══ Smart Search ═══ */}
      <SearchBar
        events={data.upcoming}
        onFilter={(filtered) => setFilteredUpcoming(filtered)}
      />

      {/* ═══ Recommended Events ═══ */}
      {data.recommended.length > 0 && (
        <section className="mb-3 section-reveal">
          <div className="section-header">
            <h2 className="section-title">Recommended for {user?.department}</h2>
          </div>
          <div className="card-grid">
            {data.recommended.map(event => (
              <EventCard
                key={event.id}
                event={event}
                actionLabel="Register"
                onAction={() => handleRegister(event.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ═══ Committees — Poster Style Cards ═══ */}
      <section className="mb-3 section-reveal">
        <div className="section-header">
          <h2 className="section-title">Committees</h2>
          <span className="section-subtitle">Explore &rarr;</span>
        </div>
        <div className="card-grid">
          {data.committees.map(c => {
            const theme = getCommitteeTheme(c.name);
            const vars = theme ? getThemeCSSVars(theme) : {};
            return (
              <Link
                to={`/committee/${c.id}`}
                key={c.id}
                className="committee-poster-card"
                style={{
                  ...vars,
                  background: theme?.colors?.heroBg || 'linear-gradient(135deg, var(--navy-dark), var(--navy))',
                  textDecoration: 'none',
                  border: `1px solid ${theme?.colors ? theme.colors.primary + '44' : 'rgba(255,255,255,0.2)'}`,
                  boxShadow: `0 10px 30px ${theme?.colors ? theme.colors.glow : 'rgba(0,0,0,0.5)'}`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }}></div>
                <div className="committee-poster-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                  <CommitteeLogo committeeName={c.name} size={72} />
                </div>
                <div className="committee-poster-name" style={{ position: 'relative', zIndex: 1, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{c.name}</div>
                <p className="committee-poster-desc" style={{ position: 'relative', zIndex: 1, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                  {theme?.tagline || c.description}
                </p>
                <div className="committee-poster-cta">
                  Explore Events <i className="fas fa-arrow-right"></i>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ═══ My Registered Events (If logged in as student) ═══ */}
      {user && user.role === 'student' && data.my_events && (
        <section className="mb-3 section-reveal">
          <div className="section-header">
            <h2 className="section-title">My Registered Events</h2>
          </div>
          {data.my_events.length > 0 ? (
            <div className="card-grid mb-3">
              {data.my_events.map(event => (
                <div className="card card-hover-lift" key={event.id}>
                  <div className="flex-between mb-1">
                    <span className="badge badge-navy">{event.committee_name}</span>
                    <span className="badge badge-success">Confirmed</span>
                  </div>
                  <h3 style={{ margin: '0.4rem 0' }}>{event.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <i className="fas fa-calendar-alt" style={{ marginRight: '6px' }}></i>
                    {new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <div style={{ marginTop: 'auto', borderTop: '1px dashed var(--border-light)', paddingTop: '1rem' }}>
                    <Link to={`/committee/${event.committee_id}`} className="btn btn-outline btn-sm">
                      Go to Portal <i className="fas fa-chevron-right" style={{ fontSize: '0.6rem', marginLeft: '4px' }}></i>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state mb-3">
              <i className="fas fa-calendar-check"></i>
              <p>No active registrations. Time to join something from the events below!</p>
            </div>
          )}
        </section>
      )}

      {/* ═══ Upcoming Events Timeline ═══ */}
      <section className="mb-3 section-reveal">
        <div className="section-header">
          <h2 className="section-title">Upcoming Events</h2>
          {filteredUpcoming !== null && (
            <span className="section-subtitle" style={{ cursor: 'pointer' }} onClick={() => setFilteredUpcoming(null)}>
              Clear Filter ✕
            </span>
          )}
        </div>
        {displayedUpcoming.length > 0 ? (
          <div className="card-grid">
            {displayedUpcoming.map(event => (
              <EventCard
                key={event.id}
                event={event}
                actionLabel="Register"
                onAction={() => handleRegister(event.id)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-calendar-day"></i>
            <p>{filteredUpcoming !== null ? 'No events match your search.' : 'No upcoming events scheduled at the moment.'}</p>
          </div>
        )}
      </section>

      {/* ═══ Past Events ═══ */}
      {data.past && data.past.length > 0 && (
        <section className="section-reveal">
          <div className="section-header">
            <h2 className="section-title">Hall of Fame</h2>
          </div>
          <div className="card-grid">
            {data.past.map(event => (
              <div className="card card-hover-lift" key={event.id}>
                <div className="flex-between mb-1" style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                  <span>{new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                  <span className="badge badge-navy" style={{ fontSize: '0.6rem' }}>{event.committee_name}</span>
                </div>
                <h3 style={{ margin: '0.4rem 0', fontSize: '1.1rem' }}>{event.title}</h3>
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div className="flex-between" style={{ background: 'var(--warning-bg)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--warning)' }}>WINNER</span>
                    <span className="badge badge-gold">{event.first_place_branch || '—'}</span>
                  </div>
                  <div className="flex-between" style={{ padding: '0.2rem 0.6rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>RUNNER UP</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{event.second_place_branch || '—'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

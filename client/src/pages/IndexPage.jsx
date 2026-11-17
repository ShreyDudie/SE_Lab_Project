import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../components/FlashMessage';
import EventCard from '../components/EventCard';
import SearchBar from '../components/SearchBar';
import CommitteeLogo from '../components/CommitteeLogo';
import CountdownTimer from '../components/CountdownTimer';
import EventTimeline from '../components/EventTimeline';
import BranchStandings from '../components/BranchStandings';
import AnimatedNumber from '../components/AnimatedNumber';
import Skeleton from '../components/Skeleton';
import TicketModal from '../components/TicketModal';
import RegistrationSuccess from '../components/RegistrationSuccess';
import ErrorState from '../components/ErrorState';
import { getCommitteeTheme, getThemeCSSVars, getCommitteeAccent } from '../utils/committeeThemes';

const INITIAL_VISIBLE = 6;

export default function IndexPage() {
  const { user } = useAuth();
  const flash = useFlash();
  const [data, setData] = useState({ committees: [], upcoming: [], recommended: [], past: [], my_events: [], leaderboard: [], stats: null });
  const [loading, setLoading] = useState(true);
  const [filteredUpcoming, setFilteredUpcoming] = useState(null);
  const [committeeFilter, setCommitteeFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const [ticketEvent, setTicketEvent] = useState(null);
  const [successEvent, setSuccessEvent] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = () => {
    fetch('/api/index', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setData(d); setFailed(false); setLoading(false); })
      .catch(() => { setFailed(true); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleRegister = async (eventId) => {
    const res = await fetch(`/api/register_event/${eventId}`, { method: 'POST', credentials: 'include' });
    const d = await res.json();
    if (res.ok) {
      flash(d.message, 'success');
      const ev = [...data.upcoming, ...data.recommended].find(e => e.id === eventId);
      if (ev) setSuccessEvent(ev);
      load(); // refresh so the card flips to "Registered"
    } else {
      flash(d.error || d.message, 'error');
    }
  };

  const registeredIds = useMemo(() => (data.my_events || []).map(e => e.id), [data.my_events]);

  const baseUpcoming = filteredUpcoming !== null ? filteredUpcoming : data.upcoming;
  const displayedUpcoming = committeeFilter === 'all'
    ? baseUpcoming
    : baseUpcoming.filter(e => e.committee_name === committeeFilter);
  const visibleUpcoming = showAll ? displayedUpcoming : displayedUpcoming.slice(0, INITIAL_VISIBLE);

  const nextEvent = data.upcoming && data.upcoming.length > 0 ? data.upcoming[0] : null;

  const upcomingByCommittee = useMemo(() => {
    const m = {};
    (data.upcoming || []).forEach(e => { m[e.committee_id] = (m[e.committee_id] || 0) + 1; });
    return m;
  }, [data.upcoming]);

  const renderEventCard = (event) => {
    const isReg = registeredIds.includes(event.id);
    return (
      <EventCard
        key={event.id}
        event={event}
        actionLabel={isReg ? 'Registered' : 'Register'}
        disabled={isReg}
        onAction={() => handleRegister(event.id)}
      />
    );
  };

  if (loading) {
    return <Skeleton />;
  }

  if (failed) {
    return <ErrorState kind="server" onRetry={() => { setLoading(true); load(); }} />;
  }

  const stats = data.stats;

  return (
    <div className="main-content">
      {/* ═══ Immersive Hero ═══ */}
      <div className="index-hero section-reveal">
        <div className="index-hero-grid">
          <div>
            <span className="hero-eyebrow"><i className="fas fa-university"></i> Veermata Jijabai Technological Institute</span>
            <h1>VJTI Events <span className="hero-accent">&amp;</span> Committees</h1>
            <p className="page-sub">
              The central hub for every committee at VJTI. Explore events, register, and build your legacy.
            </p>
            {stats && (
              <div className="hero-stats">
                <div className="hero-stat"><strong><AnimatedNumber value={data.upcoming.length} /></strong><span>Upcoming</span></div>
                <div className="hero-stat"><strong><AnimatedNumber value={stats.completed_events} /></strong><span>Concluded</span></div>
                <div className="hero-stat"><strong><AnimatedNumber value={stats.participants} /></strong><span>Students</span></div>
                <div className="hero-stat"><strong><AnimatedNumber value={stats.total_registrations} /></strong><span>Registrations</span></div>
              </div>
            )}
          </div>
          {nextEvent && (
            <div className="hero-spotlight" style={{ '--accent': getCommitteeAccent(nextEvent.committee_name) }}>
              <div className="hero-spotlight-label"><i className="fas fa-bolt"></i> Next Up</div>
              <div className="hero-spotlight-title">{nextEvent.title}</div>
              <div className="hero-spotlight-meta">
                {nextEvent.committee_name} · {new Date(nextEvent.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </div>
              <CountdownTimer date={nextEvent.date} startTime={nextEvent.start_time} />
            </div>
          )}
        </div>
      </div>

      {/* ═══ Smart Search ═══ */}
      <SearchBar
        events={data.upcoming}
        onFilter={(filtered) => { setFilteredUpcoming(filtered); setShowAll(false); }}
      />

      {/* ═══ Recommended Events ═══ */}
      {data.recommended.length > 0 && (
        <section className="mb-3 section-reveal">
          <div className="section-header">
            <h2 className="section-title">Recommended for {user?.department}</h2>
            <span className="section-subtitle">Matched to your department</span>
          </div>
          <div className="card-grid">
            {data.recommended.map(renderEventCard)}
          </div>
        </section>
      )}

      {/* ═══ Committees — Poster Style Cards ═══ */}
      <section className="mb-3 section-reveal">
        <div className="section-header">
          <h2 className="section-title">Committees</h2>
          <span className="section-subtitle">Explore &rarr;</span>
        </div>
        <div className="card-grid committee-grid">
          {data.committees.map(c => {
            const theme = getCommitteeTheme(c.name);
            const vars = theme ? getThemeCSSVars(theme) : {};
            const count = upcomingByCommittee[c.id] || 0;
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
                {count > 0 && (
                  <span className="poster-count">{count} upcoming</span>
                )}
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
            {data.my_events.length > 0 && <span className="section-subtitle">{data.my_events.length} confirmed</span>}
          </div>
          {data.my_events.length > 0 ? (
            <div className="card-grid mb-3">
              {data.my_events.map(event => (
                <div className="card card-hover-lift my-event-card" key={event.id} style={{ '--accent': getCommitteeAccent(event.committee_name) }}>
                  <div className="flex-between mb-1">
                    <span className="badge badge-navy">{event.committee_name}</span>
                    <span className="badge badge-success">Confirmed</span>
                  </div>
                  <h3 style={{ margin: '0.4rem 0' }}>{event.title}</h3>
                  <p style={{ fontSize: '0.93rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <i className="fas fa-calendar-alt" style={{ marginRight: '6px' }}></i>
                    {new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <div style={{ marginTop: 'auto', borderTop: '1px dashed var(--border-light)', paddingTop: '1rem' }}>
                    <div className="gap-row" style={{ flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setTicketEvent(event)}>
                        <i className="fas fa-ticket-alt"></i> Ticket
                      </button>
                      <Link to={`/committee/${event.committee_id}`} className="btn btn-outline btn-sm">
                        Go to Portal <i className="fas fa-chevron-right" style={{ fontSize: '0.8rem', marginLeft: '4px' }}></i>
                      </Link>
                    </div>
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

      {/* ═══ Timeline + Inter-Branch Standings ═══ */}
      {(data.upcoming.length > 0 || data.leaderboard.length > 0) && (
        <section className="mb-3 section-reveal">
          <div className="home-split">
            <div>
              <div className="section-header">
                <h2 className="section-title">Event Timeline</h2>
                <span className="section-subtitle">What&rsquo;s coming up</span>
              </div>
              <div className="panel-card">
                <EventTimeline events={data.upcoming} registeredIds={registeredIds} limit={7} />
                {data.upcoming.length > 7 && (
                  <p className="panel-foot">+ {data.upcoming.length - 7} more events scheduled &mdash; see all below</p>
                )}
              </div>
            </div>
            <div>
              <div className="section-header">
                <h2 className="section-title">Branch Standings</h2>
                <span className="section-subtitle">All committees</span>
              </div>
              <BranchStandings leaderboard={data.leaderboard} highlight={user?.department} />
            </div>
          </div>
        </section>
      )}

      {/* ═══ Upcoming Events ═══ */}
      <section className="mb-3 section-reveal" id="upcoming">
        <div className="section-header">
          <h2 className="section-title">Upcoming Events</h2>
          {filteredUpcoming !== null && (
            <span className="section-subtitle" style={{ cursor: 'pointer' }} onClick={() => setFilteredUpcoming(null)}>
              Clear Filter ✕
            </span>
          )}
        </div>

        <div className="filter-chips" role="group" aria-label="Filter by committee">
          {['all', ...data.committees.map(c => c.name)].map(name => (
            <button
              key={name}
              type="button"
              className={`filter-chip ${committeeFilter === name ? 'active' : ''}`}
              style={name !== 'all' ? { '--accent': getCommitteeAccent(name) } : undefined}
              onClick={() => { setCommitteeFilter(name); setShowAll(false); }}
              aria-pressed={committeeFilter === name}
            >
              {name === 'all' ? 'All committees' : name}
            </button>
          ))}
        </div>

        {displayedUpcoming.length > 0 ? (
          <>
            <div className="card-grid">
              {visibleUpcoming.map(renderEventCard)}
            </div>
            {displayedUpcoming.length > INITIAL_VISIBLE && (
              <div className="show-more-wrap">
                <button type="button" className="btn btn-outline" onClick={() => setShowAll(s => !s)}>
                  {showAll ? 'Show fewer events' : `Show all ${displayedUpcoming.length} events`}
                  <i className={`fas fa-chevron-${showAll ? 'up' : 'down'}`} style={{ marginLeft: '8px', fontSize: '0.84rem' }}></i>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <i className="fas fa-calendar-day"></i>
            <p>{filteredUpcoming !== null || committeeFilter !== 'all' ? 'No events match your search.' : 'No upcoming events scheduled at the moment.'}</p>
          </div>
        )}
      </section>

      {/* ═══ Past Events ═══ */}
      {data.past && data.past.length > 0 && (
        <section className="section-reveal">
          <div className="section-header">
            <h2 className="section-title">Hall of Fame</h2>
            <span className="section-subtitle">Latest results</span>
          </div>
          <div className="card-grid">
            {data.past.map(event => (
              <div className="card card-hover-lift hof-card" key={event.id} style={{ '--accent': getCommitteeAccent(event.committee_name) }}>
                <div className="flex-between mb-1" style={{ fontSize: '0.84rem', color: 'var(--text-light)' }}>
                  <span>{new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                  <span className="badge badge-navy" style={{ fontSize: '0.8rem' }}>{event.committee_name}</span>
                </div>
                <h3 style={{ margin: '0.4rem 0', fontSize: '1.1rem' }}>{event.title}</h3>
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div className="flex-between" style={{ background: 'var(--warning-bg)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)' }}>🥇 WINNER</span>
                    <span className="badge badge-gold">{event.first_place_branch || '—'}</span>
                  </div>
                  <div className="flex-between" style={{ padding: '0.2rem 0.6rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>🥈 RUNNER UP</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{event.second_place_branch || '—'}</span>
                  </div>
                  {event.third_place_branch && (
                    <div className="flex-between" style={{ padding: '0.2rem 0.6rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>🥉 THIRD</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{event.third_place_branch}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      <RegistrationSuccess
        show={!!successEvent}
        event={successEvent}
        onClose={() => setSuccessEvent(null)}
        onViewTicket={() => {
          const mine = (data.my_events || []).find(e => e.id === successEvent.id);
          setSuccessEvent(null);
          if (mine) setTicketEvent(mine);
        }}
      />

      <TicketModal
        show={!!ticketEvent}
        event={ticketEvent}
        onClose={() => setTicketEvent(null)}
        onCancelled={load}
      />
    </div>
  );
}

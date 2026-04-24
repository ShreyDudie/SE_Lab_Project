import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../components/FlashMessage';
import LeaderboardTable from '../components/LeaderboardTable';
import Modal from '../components/Modal';
import CountdownTimer from '../components/CountdownTimer';
import TechnovanzaDiscovery from '../components/TechnovanzaDiscovery';
import TeamFormation from '../components/TeamFormation';
import CommitteeLogo from '../components/CommitteeLogo';
import { getCommitteeTheme, getThemeCSSVars } from '../utils/committeeThemes';

export default function CommitteePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const flash = useFlash();
  const [data, setData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeEventId, setActiveEventId] = useState(null);
  const [broadcastEventId, setBroadcastEventId] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');

  const [eventForm, setEventForm] = useState({
    title: '', date: '', start_time: '', end_time: '', tags: '', details: ''
  });
  const [winnerForm, setWinnerForm] = useState({ first: '', second: '', third: '' });

  // View mode for Technovanza
  const [viewMode, setViewMode] = useState('events'); // 'events' | 'discover' | 'teams'

  const fetchData = () => {
    fetch(`/api/committee/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  useEffect(() => {
    fetch('/api/departments').then(r => r.json()).then(d => setDepartments(d.departments || [])).catch(() => {});
  }, []);

  const isHead = user?.role === 'head' && user?.assigned_committee === parseInt(id);
  const isAdmin = user?.role === 'admin';
  const canManage = isHead || isAdmin;

  // Get committee theme
  const theme = data ? getCommitteeTheme(data.committee.name) : null;
  const themeVars = theme ? getThemeCSSVars(theme) : {};
  const isTechnovanza = data?.committee?.name === 'Technovanza';

  // Apply full page background: Theme for students, Formal for Heads/Admins
  useEffect(() => {
    const isStudent = user?.role === 'student';
    if (isStudent && theme && theme.colors && theme.colors.heroBg) {
      document.body.style.background = theme.colors.heroBg;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.color = '#fff';
    } else {
      document.body.style.background = 'var(--cream)';
      document.body.style.color = 'var(--text)';
    }
    return () => {
      document.body.style.background = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.color = '';
    };
  }, [theme, user]);

  // ─── Handlers (ALL PRESERVED EXACTLY) ─────────────────────
  const handleRegister = async (eventId) => {
    const res = await fetch(`/api/register_event/${eventId}`, { method: 'POST', credentials: 'include' });
    const d = await res.json();
    flash(d.message || d.error, res.ok ? 'success' : 'error');
    if (res.ok) fetchData();
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    const url = editMode ? `/api/edit_event/${activeEventId}` : `/api/add_event/${id}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(eventForm)
    });
    const d = await res.json();
    flash(d.message || d.error, res.ok ? 'success' : 'error');
    if (res.ok) { setShowEventModal(false); fetchData(); }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Delete this event?')) return;
    const res = await fetch(`/api/delete_event/${eventId}`, { method: 'POST', credentials: 'include' });
    const d = await res.json();
    flash(d.message || d.error, res.ok ? 'success' : 'error');
    if (res.ok) fetchData();
  };

  const handleDeclareWinners = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/declare_winners/${activeEventId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(winnerForm)
    });
    const d = await res.json();
    flash(d.message || d.error, res.ok ? 'success' : 'error');
    if (res.ok) { setShowWinnerModal(false); fetchData(); }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastEventId) return;
    const res = await fetch(`/api/broadcast/${broadcastEventId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message: broadcastMsg })
    });
    const d = await res.json();
    flash(d.message || d.error, res.ok ? 'success' : 'error');
    if (res.ok) { setBroadcastMsg(''); }
  };

  const handleMarkAttendance = async (regId) => {
    const res = await fetch(`/api/mark_attendance/${regId}`, { method: 'POST', credentials: 'include' });
    const d = await res.json();
    flash(d.message || d.error, res.ok ? 'success' : 'error');
    if (res.ok) fetchData();
  };

  const openCreateModal = () => {
    setEditMode(false);
    setEventForm({ title: '', date: '', start_time: '', end_time: '', tags: '', details: '' });
    setShowEventModal(true);
  };

  const openEditModal = (event) => {
    setEditMode(true);
    setActiveEventId(event.id);
    setEventForm({
      title: event.title, date: event.date, start_time: event.start_time,
      end_time: event.end_time, tags: event.tags || '', details: event.details || ''
    });
    setShowEventModal(true);
  };

  const openWinnerModal = (eventId) => {
    setActiveEventId(eventId);
    setWinnerForm({ first: '', second: '', third: '' });
    setShowWinnerModal(true);
  };

  if (loading) return <div className="main-content text-center"><p className="text-muted mt-3">Loading...</p></div>;
  if (!data) return <div className="main-content"><p>Committee not found.</p></div>;

  const activeEvents = (data.all_events || []).filter(e => !e.is_completed);

  return (
    <div className={`main-content ${theme ? theme.cssClass : ''}`} style={themeVars}>
      {/* Back link + Create button */}
      <div className="flex-between mb-2">
        <Link to="/" className="gap-row" style={{ fontSize: '0.8rem', color: theme ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>
          <i className="fas fa-chevron-left" style={{ fontSize: '0.6rem' }}></i> Back to Hub
        </Link>
        {canManage && (
          <button className={theme ? 'btn-themed' : 'btn btn-primary btn-sm'} onClick={openCreateModal}>
            <i className="fas fa-plus"></i> Create Event
          </button>
        )}
      </div>

      {/* ═══ Immersive Hero Section ═══ */}
      <div className="committee-hero-immersive">
        <div className="hero-floating-shapes">
          <span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
        <div className="hero-content">
          <span className="hero-badge-themed">
            <i className={`fas ${theme?.icon || 'fa-flag'}`}></i> Official Committee
          </span>
          <div className="hero-icon-large" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <CommitteeLogo committeeName={theme?.id === 'pratibimb' ? 'Pratibimb' : data.committee.name} size={96} />
          </div>
          <h1 className="hero-title-main" style={{ fontSize: '3.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#FFFFFF', textShadow: '0 4px 12px rgba(0,0,0,0.4)', marginBottom: '0.5rem' }}>
            {data.committee.name}
          </h1>
          <h2 className={`hero-tagline ${theme?.id === 'pratibimb' ? 'glitch-text' : ''}`}
              data-text={theme?.tagline} style={{ fontSize: '2rem', opacity: 0.9 }}>
            {theme?.tagline}
          </h2>
          {theme?.subtitle && (
            <p className="hero-subtitle" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, marginTop: '1rem', fontSize: '1.1rem' }}>
              {theme.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* ═══ About Section & Leaderboard (Side-by-Side) ═══ */}
      <div className="committee-grid-2col section-reveal" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* About */}
        <div className="about-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.4rem', color: '#FFFFFF', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className={`fas ${theme?.icon || 'fa-info-circle'}`} style={{ color: 'var(--primary)' }}></i> About {data.committee.name}
          </h3>
          <p style={{ color: '#F1F5F9', fontSize: '1.05rem', lineHeight: '1.7', letterSpacing: '0.01em', fontWeight: 400, flexGrow: 1 }}>
            {theme?.about || data.committee.description}
          </p>

          {/* Filler Stats & Links to balance height */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed rgba(255,255,255,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF' }}>12+</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Core Events</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF' }}>5K+</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Footfall</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF' }}>150</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Members</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fab fa-instagram"></i></button>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fab fa-linkedin-in"></i></button>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-globe"></i></button>
            </div>
          </div>
        </div>

        {/* Points Table */}
        <div style={{ height: '100%' }}>
          <LeaderboardTable leaderboard={data.leaderboard} />
        </div>
      </div>

      {/* ═══ Technovanza: Mode Tabs ═══ */}
      {isTechnovanza && user?.role === 'student' && (
        <div className="category-tabs section-reveal">
          <button className={`category-tab ${viewMode === 'events' ? 'active' : ''}`} onClick={() => setViewMode('events')}>
            📋 Events
          </button>
          <button className={`category-tab ${viewMode === 'discover' ? 'active' : ''}`} onClick={() => setViewMode('discover')}>
            🔍 Discover
          </button>
          <button className={`category-tab ${viewMode === 'teams' ? 'active' : ''}`} onClick={() => setViewMode('teams')}>
            👥 Teams
          </button>
        </div>
      )}

      {/* ═══ Technovanza Discovery Mode ═══ */}
      {isTechnovanza && viewMode === 'discover' && user?.role === 'student' && (
        <div className="section-reveal">
          <TechnovanzaDiscovery
            events={data.upcoming_events}
            onRegister={handleRegister}
            registeredIds={data.registered_event_ids || []}
          />
        </div>
      )}

      {/* ═══ Technovanza Team Formation ═══ */}
      {isTechnovanza && viewMode === 'teams' && user?.role === 'student' && (
        <div className="section-reveal">
          <TeamFormation currentUser={user} />
        </div>
      )}

      {/* ═══ Student: Open Registrations & Registered Events ═══ */}
      {user?.role === 'student' && (!isTechnovanza || viewMode === 'events') && (
        <>
          {/* My Registered Events */}
          {data.my_events && data.my_events.length > 0 && (
            <section className="mb-3 section-reveal">
              <div className="section-header-themed">
                <h2 className="section-title">My Registered Events</h2>
              </div>
              <div className="card-grid">
                {data.my_events.map(event => {
                  const tags = event.tags ? event.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                  return (
                    <div className="themed-card" key={event.id}>
                      <div className="card-accent-line"></div>
                      <div className="flex-between mb-1">
                        <span className="themed-card-date">
                          {new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })}
                        </span>
                        <span className="themed-card-time">{event.start_time}</span>
                      </div>
                      <h3 style={{ margin: '0.4rem 0' }}>{event.title}</h3>
                      <div style={{ marginTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#4ADE80', fontWeight: 600 }}>
                          <i className="fas fa-check-circle"></i> Confirmed Registration
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Open Registrations */}
          <section className="mb-3 section-reveal">
            <div className="section-header-themed">
              <h2 className="section-title">Open Registrations</h2>
            </div>
            {data.upcoming_events.length > 0 ? (
              <div className="card-grid">
                {data.upcoming_events.map(event => {
                  const isRegistered = data.registered_event_ids.includes(event.id);
                  const tags = event.tags ? event.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                  return (
                    <div className="themed-card" key={event.id}>
                      <div className="card-accent-line"></div>
                      <div className="flex-between mb-1">
                        <span className="themed-card-date">
                          {new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })}
                        </span>
                        <span className="themed-card-time">{event.start_time}</span>
                      </div>
                      <h3 style={{ margin: '0.4rem 0' }}>{event.title}</h3>
                      <p style={{ fontSize: '0.78rem', opacity: 0.6, marginBottom: '0.5rem' }}>
                        {new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {event.details && (
                        <p className="themed-card-details">
                          {event.details.length > 150 ? event.details.substring(0, 150) + '...' : event.details}
                        </p>
                      )}
                      {tags.length > 0 && (
                        <div className="themed-card-tags">
                          {tags.map(tag => <span className="themed-tag" key={tag}>{tag}</span>)}
                        </div>
                      )}
                      <CountdownTimer date={event.date} startTime={event.start_time} themed />
                      <div style={{ marginTop: '0.75rem' }}>
                        {isRegistered ? (
                          <span style={{ fontSize: '0.78rem', color: '#4ADE80', fontWeight: 600 }}>
                            <i className="fas fa-check-circle"></i> Registered
                          </span>
                        ) : (
                          <button className="btn-themed" onClick={() => handleRegister(event.id)}>
                            <i className="fas fa-bolt"></i> Register Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" style={theme ? { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' } : {}}>
                <i className="fas fa-calendar-times"></i>
                <p>No events scheduled at this time.</p>
              </div>
            )}
          </section>

          {/* Hall of Fame (Past Events) */}
          {data.past && data.past.length > 0 && (
            <section className="mb-3 section-reveal">
              <div className="section-header-themed">
                <h2 className="section-title">Hall of Fame</h2>
              </div>
              <div className="card-grid">
                {data.past.map(event => (
                  <div className="themed-card" key={event.id}>
                    <div className="card-accent-line" style={{ background: 'var(--gold)' }}></div>
                    <div className="flex-between mb-1" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                      <span>{new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                      <i className="fas fa-trophy" style={{ color: 'var(--gold)' }}></i>
                    </div>
                    <h3 style={{ margin: '0.4rem 0', fontSize: '1.2rem' }}>{event.title}</h3>
                    
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="flex-between" style={{ background: 'rgba(255,215,0,0.1)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,215,0,0.2)' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFD700' }}>1ST PLACE</span>
                        <span className="badge badge-gold" style={{ background: '#FFD700', color: '#000' }}>{event.first_place_branch || '—'}</span>
                      </div>
                      <div className="flex-between" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.8 }}>2ND PLACE</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{event.second_place_branch || '—'}</span>
                      </div>
                      <div className="flex-between" style={{ background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.5rem', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.6 }}>3RD PLACE</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>{event.third_place_branch || '—'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ═══ Head: Event Management (PRESERVED) ═══ */}
      {isHead && (
        <>
          <section className="mb-3">
            <div className="section-header">
              <h2 className="section-title">Active Event Management</h2>
            </div>
            {activeEvents.map(event => (
              <div className="card event-mgmt-row" key={event.id} style={{ 
                background: 'var(--white)', 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--radius)', 
                padding: '1.25rem', 
                marginBottom: '1rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                boxShadow: 'var(--shadow-sm)',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div className="event-mgmt-info" style={{ flexGrow: 1 }}>
                  <h3 style={{ margin: '0 0 0.4rem 0', color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>{event.title}</h3>
                  <span className="event-meta" style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <i className="fas fa-calendar-alt" style={{ marginRight: '6px' }}></i>
                    {new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} &bull; <i className="fas fa-clock" style={{ margin: '0 4px' }}></i> {event.start_time}
                  </span>
                </div>
                <div className="event-mgmt-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => openEditModal(event)}>
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button className="btn btn-success btn-sm" onClick={() => openWinnerModal(event.id)}>
                    <i className="fas fa-trophy"></i> End Event
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteEvent(event.id)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
            {activeEvents.length === 0 && (
              <div className="empty-state" style={{ background: 'var(--white)' }}>
                <i className="fas fa-clipboard-list"></i>
                <p>No active events to manage.</p>
              </div>
            )}
          </section>

          {/* Control Console: Broadcast + Participants */}
          <div className="dashboard-grid mb-3">
            <div>
              <div className="section-header">
                <h2 className="section-title">Broadcast Notification</h2>
              </div>
              <div className="card" style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
                <form onSubmit={handleBroadcast}>
                  <div className="form-group">
                    <label className="form-label">Select Event Audience</label>
                    <select className="form-select" value={broadcastEventId} onChange={e => setBroadcastEventId(e.target.value)} required>
                      <option value="">Choose event...</option>
                      {activeEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message</label>
                    <textarea className="form-textarea" value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)}
                      placeholder="Type notification message..." required></textarea>
                  </div>
                  <button className="btn btn-primary btn-block" type="submit" disabled={!broadcastEventId}>
                    <i className="fas fa-paper-plane" style={{ marginRight: '6px' }}></i> Send Broadcast
                  </button>
                </form>
              </div>
            </div>

            <div>
              <div className="section-header">
                <h2 className="section-title">Participants</h2>
              </div>
              {data.participants.length > 0 ? (
                <div className="card" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', padding: '1rem', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                  {data.participants.slice(0, 10).map((reg, idx) => (
                    <div className="mb-1" key={reg.id} style={{ padding: '0.85rem 1rem', borderBottom: idx !== data.participants.slice(0,10).length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <div className="flex-between">
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy)' }}>{reg.username}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                            {reg.department} &bull; <span style={{ color: 'var(--success)', fontWeight: 600 }}>{reg.event_title}</span>
                          </p>
                        </div>
                        {reg.status === 'Registered' ? (
                          <button className="btn btn-outline btn-sm" onClick={() => handleMarkAttendance(reg.id)}>
                            Mark Present
                          </button>
                        ) : (
                          <span className="badge badge-success">Present</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ background: 'var(--white)' }}>
                  <i className="fas fa-users-slash"></i>
                  <p>No participants yet.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── Event Create/Edit Modal ─────────────────────── */}
      <Modal show={showEventModal} onClose={() => setShowEventModal(false)} title={editMode ? 'Edit Event' : 'Create New Event'}>
        <form onSubmit={handleSubmitEvent}>
          <div className="form-group">
            <label className="form-label">Event Title</label>
            <input className="form-input" type="text" value={eventForm.title}
              onChange={e => setEventForm({ ...eventForm, title: e.target.value })} required placeholder="e.g. CodeRush 2.0" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={eventForm.date}
                onChange={e => setEventForm({ ...eventForm, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Tags</label>
              <input className="form-input" type="text" value={eventForm.tags}
                onChange={e => setEventForm({ ...eventForm, tags: e.target.value })} placeholder="hackathon, coding, beginner" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input className="form-input" type="time" value={eventForm.start_time}
                onChange={e => setEventForm({ ...eventForm, start_time: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input className="form-input" type="time" value={eventForm.end_time}
                onChange={e => setEventForm({ ...eventForm, end_time: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Details &amp; Rules</label>
            <textarea className="form-textarea" value={eventForm.details}
              onChange={e => setEventForm({ ...eventForm, details: e.target.value })}
              placeholder="Describe the event, prizes, requirements..."></textarea>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowEventModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editMode ? 'Update Event' : 'Create Event'}</button>
          </div>
        </form>
      </Modal>

      {/* ─── Winner Declaration Modal ────────────────────── */}
      <Modal show={showWinnerModal} onClose={() => setShowWinnerModal(false)} title="Declare Final Standings">
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Submit to conclude this event and award branch points.
        </p>
        <form onSubmit={handleDeclareWinners}>
          {[
            { key: 'first', label: '1st Place — Champions', pts: '+10 PTS', color: 'var(--gold)' },
            { key: 'second', label: '2nd Place — Runners-up', pts: '+5 PTS', color: 'var(--text-muted)' },
            { key: 'third', label: '3rd Place', pts: '+3 PTS', color: '#8B5E34' },
          ].map(place => (
            <div className="form-group" key={place.key}
              style={{ background: 'var(--cream)', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
              <div className="flex-between mb-1">
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: place.color }}>
                  {place.label}
                </span>
                <span className="badge badge-muted">{place.pts}</span>
              </div>
              <select className="form-select" value={winnerForm[place.key]}
                onChange={e => setWinnerForm({ ...winnerForm, [place.key]: e.target.value })} required>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name} Department</option>)}
              </select>
            </div>
          ))}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowWinnerModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-success">Finalize Results</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../components/FlashMessage';
import LeaderboardTable from '../components/LeaderboardTable';
import Modal from '../components/Modal';

const DEPARTMENTS = ['IT', 'CS', 'Mech', 'Prod', 'Text', 'EXTC', 'Tronics', 'Trical', 'Civil', 'Diploma'];

export default function CommitteePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const flash = useFlash();
  const [data, setData] = useState(null);
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

  const fetchData = () => {
    fetch(`/api/committee/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  const isHead = user?.role === 'head' && user?.assigned_committee === parseInt(id);
  const isAdmin = user?.role === 'admin';
  const canManage = isHead || isAdmin;

  // ─── Handlers ─────────────────────────────────────────
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
    <div className="main-content">
      {/* Back link + Create button */}
      <div className="flex-between mb-2">
        <Link to="/" className="gap-row" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <i className="fas fa-chevron-left" style={{ fontSize: '0.6rem' }}></i> Back to Hub
        </Link>
        {canManage && (
          <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
            <i className="fas fa-plus"></i> Create Event
          </button>
        )}
      </div>

      {/* Hero */}
      <div className="committee-hero">
        <div className="hero-info">
          <span className="hero-badge">Official Committee</span>
          <h1>{data.committee.name}</h1>
          <p>{data.committee.description}</p>
        </div>
        <LeaderboardTable leaderboard={data.leaderboard} />
      </div>

      {/* Student: Open Registrations */}
      {user?.role === 'student' && (
        <section className="mb-3">
          <div className="section-header">
            <h2 className="section-title">Open Registrations</h2>
          </div>
          {data.upcoming_events.length > 0 ? (
            <div className="card-grid">
              {data.upcoming_events.map(event => {
                const isRegistered = data.registered_event_ids.includes(event.id);
                return (
                  <div className="card" key={event.id}>
                    <div className="flex-between mb-1">
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--burgundy)' }}>
                        {new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{event.start_time}</span>
                    </div>
                    <h3 style={{ margin: '0.4rem 0' }}>{event.title}</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      {new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    {isRegistered ? (
                      <span className="badge badge-success"><i className="fas fa-check-circle"></i> Already Registered</span>
                    ) : (
                      <button className="btn btn-primary btn-sm btn-block" onClick={() => handleRegister(event.id)}>
                        Confirm Attendance
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <i className="fas fa-calendar-times"></i>
              <p>No events scheduled at this time.</p>
            </div>
          )}
        </section>
      )}

      {/* Head: Event Management */}
      {isHead && (
        <>
          <section className="mb-3">
            <div className="section-header">
              <h2 className="section-title">Active Event Management</h2>
            </div>
            {activeEvents.map(event => (
              <div className="event-mgmt-row" key={event.id}>
                <div className="event-mgmt-info">
                  <h3>{event.title}</h3>
                  <span className="event-meta">
                    {new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} &bull; {event.start_time}
                  </span>
                </div>
                <div className="event-mgmt-actions">
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
              <div className="empty-state"><i className="fas fa-clipboard-list"></i><p>No active events.</p></div>
            )}
          </section>

          {/* Control Console: Broadcast + Participants */}
          <div className="dashboard-grid mb-3">
            <div>
              <div className="section-header">
                <h2 className="section-title">Broadcast Notification</h2>
              </div>
              <div className="card">
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
                    Send Broadcast
                  </button>
                </form>
              </div>
            </div>

            <div>
              <div className="section-header">
                <h2 className="section-title">Participants</h2>
              </div>
              {data.participants.length > 0 ? (
                <div>
                  {data.participants.slice(0, 10).map(reg => (
                    <div className="card mb-1" key={reg.id} style={{ padding: '0.75rem 1rem' }}>
                      <div className="flex-between">
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>{reg.username}</p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {reg.department} &bull; {reg.event_title}
                          </p>
                        </div>
                        {reg.status === 'Registered' ? (
                          <button className="btn btn-outline btn-sm" onClick={() => handleMarkAttendance(reg.id)}>
                            Mark Present
                          </button>
                        ) : (
                          <span className="badge badge-success"><i className="fas fa-check-double"></i> Verified</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><i className="fas fa-users"></i><p>No registrations yet.</p></div>
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
                onChange={e => setEventForm({ ...eventForm, tags: e.target.value })} placeholder="IT, CS, Mech" />
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
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d} Department</option>)}
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

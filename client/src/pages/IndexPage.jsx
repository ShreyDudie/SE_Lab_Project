import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../components/FlashMessage';
import EventCard from '../components/EventCard';

export default function IndexPage() {
  const { user } = useAuth();
  const flash = useFlash();
  const [data, setData] = useState({ committees: [], upcoming: [], recommended: [], past: [] });
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="main-content text-center"><p className="text-muted mt-3">Loading...</p></div>;
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>VJTI Events &amp; Committees</h1>
        <p className="page-sub">
          The central hub for every committee at VJTI. Explore events, register, and build your legacy.
        </p>
      </div>

      {/* Recommended Events */}
      {data.recommended.length > 0 && (
        <section className="mb-3">
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

      {/* Committees */}
      <section className="mb-3">
        <div className="section-header">
          <h2 className="section-title">Committees</h2>
          <span className="section-subtitle">Explore &rarr;</span>
        </div>
        <div className="card-grid">
          {data.committees.map(c => (
            <Link to={`/committee/${c.id}`} key={c.id} className="card" style={{ textDecoration: 'none' }}>
              <div className="flex-between mb-1">
                <div style={{
                  width: 40, height: 40, background: 'var(--cream-dark)', borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--navy)'
                }}>
                  {c.name[0]}
                </div>
                <span className="badge badge-muted">View</span>
              </div>
              <h3 style={{ marginTop: '0.5rem' }}>{c.name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Upcoming Timeline */}
      <section className="mb-3">
        <div className="section-header">
          <h2 className="section-title">Upcoming Events</h2>
        </div>
        {data.upcoming.length > 0 ? (
          <div className="card-grid">
            {data.upcoming.map(event => (
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
            <p>No upcoming events scheduled at the moment.</p>
          </div>
        )}
      </section>

      {/* Past Events */}
      {data.past.length > 0 && (
        <section>
          <div className="section-header">
            <h2 className="section-title">Recent Results</h2>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Committee</th>
                  <th>1st Place</th>
                  <th>2nd Place</th>
                  <th>3rd Place</th>
                </tr>
              </thead>
              <tbody>
                {data.past.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 700 }}>{e.title}</td>
                    <td>{e.committee_name}</td>
                    <td><span className="badge badge-gold">{e.first_place_branch || '—'}</span></td>
                    <td>{e.second_place_branch || '—'}</td>
                    <td>{e.third_place_branch || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../components/FlashMessage';

export default function DashboardPage() {
  const { user } = useAuth();
  const flash = useFlash();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="main-content text-center"><p className="text-muted mt-3">Loading...</p></div>;
  if (!data) return <div className="main-content"><p>Error loading dashboard.</p></div>;

  // Pending approval
  if (data.pending_approval) {
    return (
      <div className="main-content">
        <div className="pending-wrapper">
          <div className="pending-icon"><i className="fas fa-clock"></i></div>
          <h1>Account Pending Approval</h1>
          <p className="mt-1" style={{ color: 'var(--text-light)', maxWidth: 480, margin: '0.5rem auto 0' }}>
            Your request to join as a Committee Head has been submitted. You will gain access once verified.
          </p>
        </div>
      </div>
    );
  }

  // ─── Student Dashboard ──────────────────────────────────
  if (data.role === 'student') {
    return (
      <div className="main-content">
        <div className="page-header">
          <p className="page-label">Student Portal</p>
          <h1>Your Schedule</h1>
          <p className="page-sub">Logged in as <strong>{user.username}</strong></p>
        </div>

        <div className="flex-between mb-2">
          <div className="section-header" style={{ marginBottom: 0 }}>
            <h2 className="section-title">Active Registrations</h2>
          </div>
          <Link to="/" className="btn btn-primary btn-sm">Discover Events</Link>
        </div>

        {data.my_events.length > 0 ? (
          <div className="card-grid mb-3">
            {data.my_events.map(event => (
              <div className="card" key={event.id}>
                <div className="flex-between mb-1">
                  <span className="badge badge-navy">{event.committee_name}</span>
                  <span className="badge badge-success">Confirmed</span>
                </div>
                <h3 style={{ margin: '0.4rem 0' }}>{event.title}</h3>
                <div className="gap-row" style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                  <i className="fas fa-calendar-alt" style={{ fontSize: '0.7rem' }}></i>
                  {new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  <span style={{ color: 'var(--border)' }}>|</span>
                  <i className="fas fa-clock" style={{ fontSize: '0.7rem' }}></i>
                  {event.start_time}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state mb-3">
            <i className="fas fa-calendar-check"></i>
            <p>No active registrations. Time to join something!</p>
          </div>
        )}

        <div className="section-header">
          <h2 className="section-title">Notifications</h2>
        </div>
        {data.messages.length > 0 ? (
          <div>
            {data.messages.map(msg => (
              <div className="message-card" key={msg.id}>
                <h4>{msg.title}</h4>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-bell-slash"></i>
            <p>No notifications.</p>
          </div>
        )}
      </div>
    );
  }

  // ─── Head Dashboard ─────────────────────────────────────
  if (data.role === 'head') {
    return (
      <div className="main-content">
        <div className="page-header">
          <p className="page-label">Committee Console</p>
          <h1>{data.committee.name} &mdash; Dashboard</h1>
          <p className="page-sub">Logged in as <strong>{user.username}</strong></p>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{data.active_events.length}</div>
            <div className="stat-label">Active Events</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{data.past_events.length}</div>
            <div className="stat-label">Archived</div>
          </div>
        </div>

        <div className="flex-between mb-2">
          <div className="section-header" style={{ marginBottom: 0 }}>
            <h2 className="section-title">Active Events</h2>
          </div>
          <Link to={`/committee/${data.committee.id}`} className="btn btn-primary btn-sm">
            <i className="fas fa-cog"></i> Manage Committee
          </Link>
        </div>

        {data.active_events.length > 0 ? (
          <div className="card-grid mb-3">
            {data.active_events.map(event => (
              <div className="card" key={event.id}>
                <div className="flex-between mb-1">
                  <span className="badge badge-success">Active</span>
                </div>
                <h3 style={{ margin: '0.4rem 0' }}>{event.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <Link to={`/committee/${data.committee.id}`} className="btn btn-outline btn-sm mt-1">Manage</Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state mb-3">
            <i className="fas fa-clipboard-list"></i>
            <p>No active events.</p>
          </div>
        )}

        <div className="section-header">
          <h2 className="section-title">Past Events</h2>
        </div>
        {data.past_events.length > 0 ? (
          <div className="card-grid">
            {data.past_events.map(event => (
              <div className="card" key={event.id} style={{ opacity: 0.85 }}>
                <div className="flex-between mb-1">
                  <span className="badge badge-muted">Completed</span>
                </div>
                <h3 style={{ margin: '0.4rem 0' }}>{event.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <Link to={`/event_results/${event.id}`} className="btn btn-outline btn-sm mt-1">
                  View Results <i className="fas fa-chevron-right" style={{ fontSize: '0.6rem' }}></i>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-archive"></i>
            <p>No archived events.</p>
          </div>
        )}
      </div>
    );
  }

  // ─── Admin Dashboard ────────────────────────────────────
  if (data.role === 'admin') {
    const handleApprove = async (userId) => {
      const res = await fetch(`/api/approve_head/${userId}`, { method: 'POST', credentials: 'include' });
      const d = await res.json();
      if (res.ok) {
        flash(d.message, 'success');
        // Refresh
        window.location.reload();
      } else {
        flash(d.error, 'error');
      }
    };

    return (
      <div className="main-content">
        <div className="page-header">
          <p className="page-label">Administration</p>
          <h1>Admin Portal</h1>
          <p className="page-sub">Logged in as <strong>{user.username}</strong></p>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{data.all_events.length}</div>
            <div className="stat-label">Total Events</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{data.pending_heads.length}</div>
            <div className="stat-label">Pending Requests</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{data.committees.length}</div>
            <div className="stat-label">Committees</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-success">●</div>
            <div className="stat-label">System Status</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div>
            <div className="section-header">
              <h2 className="section-title">All Events</h2>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Committee</th>
                    <th>Event</th>
                    <th style={{ textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.all_events.map(event => (
                    <tr key={event.id}>
                      <td style={{ fontWeight: 700, color: 'var(--burgundy)' }}>{event.committee_name}</td>
                      <td>{event.title}</td>
                      <td style={{ textAlign: 'right' }}>
                        {event.is_completed
                          ? <span className="badge badge-muted">Done</span>
                          : <span className="badge badge-success">Live</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="section-header">
              <h2 className="section-title" style={{ color: 'var(--danger)' }}>Pending Approvals</h2>
            </div>
            {data.pending_heads.length > 0 ? (
              <div>
                {data.pending_heads.map(head => (
                  <div className="card mb-1" key={head.id}>
                    <p style={{ fontWeight: 700 }}>{head.username}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      Committee #{head.assigned_committee}
                    </p>
                    <button className="btn btn-success btn-sm btn-block" onClick={() => handleApprove(head.id)}>
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-check-double"></i>
                <p>No pending requests.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

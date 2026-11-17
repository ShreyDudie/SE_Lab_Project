import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../components/FlashMessage';
import BranchStandings from '../components/BranchStandings';
import AnimatedNumber from '../components/AnimatedNumber';
import Skeleton from '../components/Skeleton';
import TicketModal from '../components/TicketModal';
import WelcomeBanner from '../components/WelcomeBanner';
import ErrorState from '../components/ErrorState';
import { getCommitteeAccent } from '../utils/committeeThemes';

export default function DashboardPage() {
  const { user } = useAuth();
  const flash = useFlash();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ticketEvent, setTicketEvent] = useState(null);

  const load = () => {
    fetch('/api/dashboard', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Skeleton variant="dashboard" />;
  if (!data) return <ErrorState kind="server" onRetry={() => { setLoading(true); load(); }} />;

  // Pending approval
  if (data.pending_approval) {
    return (
      <div className="main-content">
        <WelcomeBanner username={user.username} />
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
          <WelcomeBanner username={user.username} />
          <p className="page-label">Student Portal</p>
          <h1>Your Schedule</h1>
          <p className="page-sub">Logged in as <strong>{user.username}</strong>{data.department ? <> &middot; {data.department} department</> : null}</p>
        </div>

        <div className="stats-row section-reveal">
          <div className="stat-card stat-card-accent" style={{ '--accent': '#2A6496' }}>
            <div className="stat-icon"><i className="fas fa-calendar-check"></i></div>
            <div className="stat-value"><AnimatedNumber value={data.my_events.length} /></div>
            <div className="stat-label">Active Registrations</div>
          </div>
          <div className="stat-card stat-card-accent" style={{ '--accent': '#2E7D4F' }}>
            <div className="stat-icon"><i className="fas fa-user-check"></i></div>
            <div className="stat-value"><AnimatedNumber value={(data.history || []).filter(h => h.status === 'Attended').length} /></div>
            <div className="stat-label">Events Attended</div>
          </div>
          <div className="stat-card stat-card-accent" style={{ '--accent': '#C5973B' }}>
            <div className="stat-icon"><i className="fas fa-medal"></i></div>
            <div className="stat-value">{data.dept_standing ? `#${data.dept_standing.rank}` : '—'}</div>
            <div className="stat-label">{data.dept_standing ? `${data.dept_standing.department} Standing · ${data.dept_standing.score} pts` : 'Dept Standing'}</div>
          </div>
          <div className="stat-card stat-card-accent" style={{ '--accent': '#8B2252' }}>
            <div className="stat-icon"><i className="fas fa-bell"></i></div>
            <div className="stat-value"><AnimatedNumber value={data.messages.length} /></div>
            <div className="stat-label">Notifications</div>
          </div>
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
              <div className="card card-hover-lift" key={event.id}>
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
                      <i className="fas fa-ticket-alt"></i> View Ticket
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
            <p>No active registrations. Time to join something!</p>
          </div>
        )}

        <div className="section-header">
          <h2 className="section-title">Notifications</h2>
          {data.messages.length > 0 && <span className="section-subtitle">{data.messages.length} messages</span>}
        </div>
        {data.messages.length > 0 ? (
          <div className="messages-list scroll-area">
            {data.messages.map((msg, idx) => (
              <div className="message-card" key={msg.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderLeft: '4px solid var(--info)', padding: '1.25rem', borderRadius: 'var(--radius)', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ color: 'var(--navy)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                  <i className="fas fa-bell" style={{ color: 'var(--info)' }}></i> {msg.title}
                </h4>
                <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>{msg.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-bell-slash"></i>
            <p>No new notifications from committees.</p>
          </div>
        )}
        {data.history && data.history.length > 0 && (
          <section className="mt-3 section-reveal">
            <div className="section-header">
              <h2 className="section-title">My Participation History</h2>
              <span className="section-subtitle">{data.history.length} events</span>
            </div>
            <div className="panel-card history-list scroll-area">
              {data.history.slice(0, 8).map(h => (
                <div className="history-row" key={h.id} style={{ '--accent': getCommitteeAccent(h.committee_name) }}>
                  <div className="history-dot"></div>
                  <div className="history-main">
                    <div className="history-title">{h.title}</div>
                    <div className="history-sub">
                      {h.committee_name} &middot; {new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  {h.rating ? (
                    <span className="history-rating" title="Your rating">
                      {'★'.repeat(h.rating)}<span style={{ opacity: 0.25 }}>{'★'.repeat(5 - h.rating)}</span>
                    </span>
                  ) : null}
                  <span className={`badge ${h.status === 'Attended' ? 'badge-success' : 'badge-muted'}`}>
                    {h.status === 'Attended' ? 'Attended' : 'Missed'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-3">
          <div className="section-header">
            <h2 className="section-title">Hall of Fame</h2>
          </div>
          {data.past && data.past.length > 0 ? (
            <div className="card-grid">
              {data.past.map(event => (
                <div className="card card-hover-lift" key={event.id}>
                  <div className="flex-between mb-1" style={{ fontSize: '0.84rem', color: 'var(--text-light)' }}>
                    <span>{new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                    <i className="fas fa-award" style={{ color: 'var(--gold)' }}></i>
                  </div>
                  <h3 style={{ margin: '0.4rem 0', fontSize: '1.1rem' }}>{event.title}</h3>
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div className="flex-between" style={{ background: 'var(--warning-bg)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)' }}>WINNER</span>
                      <span className="badge badge-gold">{event.first_place_branch || '—'}</span>
                    </div>
                    <div className="flex-between" style={{ padding: '0.2rem 0.6rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>RUNNER UP</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{event.second_place_branch || '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <i className="fas fa-trophy"></i>
              <p>No Hall of Fame results to display yet.</p>
            </div>
          )}
        </section>

        <TicketModal
          show={!!ticketEvent}
          event={ticketEvent}
          onClose={() => setTicketEvent(null)}
          onCancelled={load}
        />
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
          {data.stats && (
            <>
              <div className="stat-card">
                <div className="stat-value"><AnimatedNumber value={data.stats.total_registrations} /></div>
                <div className="stat-label">Total Registrations</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{data.stats.attendance_rate}%</div>
                <div className="stat-label">Attendance Rate</div>
              </div>
            </>
          )}
        </div>

        {data.leaderboard && data.leaderboard.some(l => l.score > 0) && (
          <div className="mb-3 section-reveal">
            <BranchStandings leaderboard={data.leaderboard} title={`${data.committee.name} Standings`} compact />
          </div>
        )}

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
              <div className="card card-hover-lift" key={event.id}>
                <div className="flex-between mb-1">
                  <span className="badge badge-success">Active</span>
                </div>
                <h3 style={{ margin: '0.4rem 0' }}>{event.title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
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
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  {new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <Link to={`/event_results/${event.id}`} className="btn btn-outline btn-sm mt-1">
                  View Results <i className="fas fa-chevron-right" style={{ fontSize: '0.8rem' }}></i>
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
        window.location.reload();
      } else {
        flash(d.error, 'error');
      }
    };

    // Analytics calculations
    const totalEvents = data.all_events.length;
    const activeEvents = data.all_events.filter(e => !e.is_completed).length;
    const completedEvents = data.all_events.filter(e => e.is_completed).length;
    const totalRegistrations = data.all_events.reduce((sum, e) => sum + (e.registration_count || 0), 0);

    // Committee event counts for bar chart
    const committeeStats = {};
    data.all_events.forEach(e => {
      const name = e.committee_name || 'Unknown';
      if (!committeeStats[name]) committeeStats[name] = { events: 0, registrations: 0 };
      committeeStats[name].events += 1;
      committeeStats[name].registrations += (e.registration_count || 0);
    });
    const maxRegs = Math.max(...Object.values(committeeStats).map(c => c.registrations), 1);

    const committeeColors = {
      'Pratibimb': '#DC2626',
      'Enthusia': '#F59E0B',
      'Technovanza': '#3B82F6',
      'COC': '#22C55E',
    };

    // Most popular committee
    const mostPopular = Object.entries(committeeStats).sort((a, b) => b[1].registrations - a[1].registrations)[0];

    return (
      <div className="main-content">
        <div className="page-header">
          <p className="page-label">Administration</p>
          <h1>Admin Portal</h1>
          <p className="page-sub">Logged in as <strong>{user.username}</strong></p>
        </div>

        {/* ═══ Analytics Dashboard ═══ */}
        <div className="analytics-grid section-reveal">
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="analytics-value">{totalEvents}</div>
            <div className="analytics-label">Total Events</div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
              <i className="fas fa-bolt"></i>
            </div>
            <div className="analytics-value">{activeEvents}</div>
            <div className="analytics-label">Active Events</div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: '#FEF3C7', color: '#92400E' }}>
              <i className="fas fa-users"></i>
            </div>
            <div className="analytics-value">{totalRegistrations}</div>
            <div className="analytics-label">Total Registrations</div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: '#FCE7F3', color: '#9D174D' }}>
              <i className="fas fa-star"></i>
            </div>
            <div className="analytics-value" style={{ fontSize: '1.2rem' }}>{mostPopular ? mostPopular[0] : '—'}</div>
            <div className="analytics-label">Most Popular</div>
          </div>
        </div>

        {/* ═══ Committee Performance Bar Chart ═══ */}
        <div className="analytics-bar-chart mb-3 section-reveal">
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <h2 className="section-title" style={{ fontSize: '1rem' }}>Committee Engagement</h2>
          </div>
          {Object.entries(committeeStats).map(([name, stats]) => (
            <div className="bar-row" key={name}>
              <span className="bar-label">{name}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{
                  width: `${Math.max((stats.registrations / maxRegs) * 100, 8)}%`,
                  background: committeeColors[name] || 'var(--navy)'
                }}>
                  {stats.registrations} reg · {stats.events} events
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ Global Inter-Branch Standings ═══ */}
        {data.leaderboard && (
          <div className="mb-3 section-reveal">
            <BranchStandings leaderboard={data.leaderboard} title="Global Inter-Branch Leaderboard" />
          </div>
        )}

        {/* ═══ Existing Admin Sections (PRESERVED) ═══ */}
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
            <div className="stat-value text-success">Working</div>
            <div className="stat-label">System Status</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div>
            <div className="section-header">
              <h2 className="section-title">All Events</h2>
            </div>
            <div className="table-wrapper table-scroll">
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
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
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

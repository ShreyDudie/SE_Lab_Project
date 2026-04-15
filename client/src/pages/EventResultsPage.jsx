import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function EventResultsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/event_results/${id}`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('Unauthorized');
        return r.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="main-content text-center"><p className="text-muted mt-3">Loading...</p></div>;
  if (!data) return (
    <div className="main-content">
      <div className="empty-state">
        <i className="fas fa-lock"></i>
        <p>Unauthorized or event not found.</p>
        <Link to="/dashboard" className="btn btn-outline mt-2">Back to Dashboard</Link>
      </div>
    </div>
  );

  const { event, total_reg, attended_count, attendance_rate, attendees } = data;

  return (
    <div className="main-content">
      <Link to="/dashboard" className="gap-row mb-2" style={{ fontSize: '0.8rem', color: 'var(--burgundy)' }}>
        <i className="fas fa-arrow-left" style={{ fontSize: '0.65rem' }}></i> Back to Dashboard
      </Link>

      <div className="page-header">
        <h1>{event.title}</h1>
        <p className="page-sub">
          Post-Event Performance Report &mdash; {new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="dashboard-grid mb-3">
        {/* Podium Standings */}
        <div>
          <div className="section-header">
            <h2 className="section-title">Podium Standings</h2>
          </div>
          <div className="card mb-1" style={{ background: '#FFFBEB', borderColor: '#E6D9A8' }}>
            <div className="gap-row">
              <span style={{ fontSize: '1.5rem' }}>🥇</span>
              <div>
                <span className="card-label" style={{ color: 'var(--gold)' }}>First Place</span>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy)' }}>{event.first_place_branch || '—'}</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="card">
              <span className="card-label">Second Place</span>
              <p style={{ fontSize: '1rem', fontWeight: 700 }}>{event.second_place_branch || '—'}</p>
            </div>
            <div className="card" style={{ background: '#FFF7ED', borderColor: '#E8D5B8' }}>
              <span className="card-label" style={{ color: '#8B5E34' }}>Third Place</span>
              <p style={{ fontSize: '1rem', fontWeight: 700 }}>{event.third_place_branch || '—'}</p>
            </div>
          </div>
        </div>

        {/* Engagement Stats */}
        <div>
          <div className="section-header">
            <h2 className="section-title">Engagement</h2>
          </div>
          <div className="leaderboard-panel">
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{attendance_rate}%</p>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>Attendance Rate</p>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: '1.25rem' }}>
              <div style={{ height: '100%', width: `${attendance_rate}%`, background: 'var(--gold)', borderRadius: 3 }}></div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
              <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>Total Registered</span>
                <span style={{ fontWeight: 800 }}>{total_reg}</span>
              </div>
              <div className="flex-between">
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>Total Attended</span>
                <span style={{ fontWeight: 800, color: 'var(--gold-light)' }}>{attended_count}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Participant Log */}
      <div className="section-header">
        <h2 className="section-title">Official Participant Log</h2>
        <span className="badge badge-success">Verified</span>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Department</th>
              <th style={{ textAlign: 'right' }}>Verification</th>
            </tr>
          </thead>
          <tbody>
            {attendees.length > 0 ? attendees.map(reg => (
              <tr key={reg.id}>
                <td style={{ fontWeight: 600 }}>{reg.username}</td>
                <td><span style={{ color: 'var(--burgundy)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.78rem' }}>{reg.department}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <i className="fas fa-check-circle text-success"></i>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No attendance records found for this event.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

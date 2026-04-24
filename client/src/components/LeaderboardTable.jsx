export default function LeaderboardTable({ leaderboard }) {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="leaderboard-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="panel-title" style={{ fontSize: '1.4rem', color: '#FFFFFF', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fas fa-trophy" style={{ color: 'var(--gold)' }}></i> Points Table
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', fontStyle: 'italic', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No points recorded yet. Award points by concluding events.
        </p>
      </div>
    );
  }

  return (
    <div className="leaderboard-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      <div className="panel-title" style={{ fontSize: '1.4rem', color: '#FFFFFF', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
        <i className="fas fa-trophy" style={{ color: '#FCD34D', textShadow: '0 0 10px rgba(252,211,77,0.5)' }}></i> Live Standings
      </div>
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {leaderboard.map((item, idx) => (
          <div className="leaderboard-row" key={idx} style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            background: idx === 0 ? 'linear-gradient(90deg, rgba(252,211,77,0.15), transparent)' : 'rgba(255,255,255,0.05)',
            border: idx === 0 ? '1px solid rgba(252,211,77,0.3)' : '1px solid transparent',
            padding: '0.8rem 1rem', borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}>
            <span className="leaderboard-branch" style={{ 
              fontWeight: idx === 0 ? 800 : 600, 
              color: idx === 0 ? '#FCD34D' : '#F8FAFC',
              fontSize: '1.1rem',
              letterSpacing: '0.02em'
            }}>
              {idx === 0 && <i className="fas fa-crown" style={{ marginRight: '6px', fontSize: '0.9rem' }}></i>}
              {item.branch}
            </span>
            <span className="leaderboard-score" style={{ 
              fontWeight: 800, 
              background: idx === 0 ? '#FCD34D' : 'rgba(255,255,255,0.1)', 
              color: idx === 0 ? '#000' : '#FFFFFF',
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              fontSize: '0.9rem',
              boxShadow: idx === 0 ? '0 0 10px rgba(252,211,77,0.4)' : 'none'
            }}>
              {item.score} PTS
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

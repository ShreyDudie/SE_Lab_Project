export default function LeaderboardTable({ leaderboard }) {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="leaderboard-panel">
        <div className="panel-title"><i className="fas fa-trophy"></i> Points Table</div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', fontStyle: 'italic' }}>
          No points recorded yet. Award points by concluding events.
        </p>
      </div>
    );
  }

  return (
    <div className="leaderboard-panel">
      <div className="panel-title"><i className="fas fa-trophy"></i> Points Table</div>
      {leaderboard.map((item, idx) => (
        <div className="leaderboard-row" key={idx}>
          <span className="leaderboard-branch">{item.branch}</span>
          <span className="leaderboard-score">{item.score} PTS</span>
        </div>
      ))}
    </div>
  );
}

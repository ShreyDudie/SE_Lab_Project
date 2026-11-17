/**
 * Light-themed inter-branch standings: a podium for the top 3 and
 * progress bars for the remaining branches.
 */
export default function BranchStandings({ leaderboard = [], highlight = null, title = 'Inter-Branch Championship', compact = false }) {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="standings-card">
        <div className="standings-title"><i className="fas fa-trophy"></i> {title}</div>
        <p className="standings-empty">No points recorded yet. Conclude an event to award points.</p>
      </div>
    );
  }
  const max = Math.max(...leaderboard.map(l => l.score), 1);
  const top = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  // podium visual order: 2nd, 1st, 3rd
  const podium = [top[1], top[0], top[2]].filter(Boolean);
  const rankOf = (item) => leaderboard.indexOf(item) + 1;
  const medal = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const rows = compact ? leaderboard : rest;

  return (
    <div className="standings-card">
      <div className="standings-title"><i className="fas fa-trophy"></i> {title}</div>
      {!compact && (
        <div className="podium">
          {podium.map(item => {
            const r = rankOf(item);
            return (
              <div key={item.branch} className={`podium-col podium-${r} ${highlight === item.branch ? 'is-me' : ''}`}>
                <div className="podium-medal">{medal[r]}</div>
                <div className="podium-name">{item.branch}</div>
                <div className="podium-score">{item.score} pts</div>
                <div className="podium-block"><span>{r}</span></div>
              </div>
            );
          })}
        </div>
      )}
      <div className="standings-list">
        {rows.map((item) => {
          const r = rankOf(item);
          return (
            <div key={item.branch} className={`standings-row ${highlight === item.branch ? 'is-me' : ''}`}>
              <span className="standings-rank">{r}</span>
              <span className="standings-branch">{item.branch}{highlight === item.branch && <em> · you</em>}</span>
              <div className="standings-track"><div className="standings-fill" style={{ width: `${Math.max((item.score / max) * 100, 2)}%` }}></div></div>
              <span className="standings-pts">{item.score}</span>
            </div>
          );
        })}
      </div>
      <p className="standings-note">1st = 10 pts · 2nd = 5 pts · 3rd = 3 pts per concluded event</p>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { getCommitteeAccent } from '../utils/committeeThemes';

/**
 * Vertical event timeline grouped by month.
 * `events` should already be sorted by date ascending (the API does this).
 */
export default function EventTimeline({ events = [], registeredIds = [], limit = 8 }) {
  const items = events.slice(0, limit);
  if (items.length === 0) return null;

  const fmtTime = (s) => {
    if (!s) return '';
    const [h, m] = s.split(':');
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const groups = [];
  items.forEach(ev => {
    const d = new Date(ev.date + 'T00:00:00');
    const key = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) { g = { key, items: [] }; groups.push(g); }
    g.items.push({ ev, d });
  });

  const daysAway = (d) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const n = Math.round((d - today) / 86400000);
    if (n <= 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    return `in ${n} days`;
  };

  return (
    <div className="timeline">
      {groups.map(g => (
        <div className="timeline-month" key={g.key}>
          <div className="timeline-month-label">{g.key}</div>
          {g.items.map(({ ev, d }) => {
            const accent = getCommitteeAccent(ev.committee_name);
            const registered = registeredIds.includes(ev.id);
            return (
              <Link to={`/committee/${ev.committee_id}`} className="timeline-item" key={ev.id} style={{ '--accent': accent }}>
                <div className="timeline-date">
                  <span className="timeline-day">{d.getDate()}</span>
                  <span className="timeline-dow">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                </div>
                <div className="timeline-dot"></div>
                <div className="timeline-body">
                  <div className="timeline-title">{ev.title}</div>
                  <div className="timeline-meta">
                    <span className="timeline-chip">{ev.committee_name}</span>
                    <span><i className="far fa-clock"></i> {fmtTime(ev.start_time)}</span>
                    <span className="timeline-away">{daysAway(d)}</span>
                    {registered && <span className="timeline-reg"><i className="fas fa-check-circle"></i> Registered</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

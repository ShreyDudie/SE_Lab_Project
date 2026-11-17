import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { playSound } from '../utils/sound';

const SEEN_KEY = 'vjti_notifications_seen';

function readSeen(username) {
  try { return parseInt(localStorage.getItem(`${SEEN_KEY}_${username}`) || '0', 10); } catch { return 0; }
}
function writeSeen(username, value) {
  try { localStorage.setItem(`${SEEN_KEY}_${username}`, String(value)); } catch { /* storage unavailable */ }
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).getTime();
  const mins = Math.max(Math.floor(diff / 60000), 0);
  if (mins < 60) return `${mins || 1}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Navbar notification bell for students: dropdown with a scrollable list. */
export default function NotificationBell({ user }) {
  const [messages, setMessages] = useState([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(() => readSeen(user.username));
  const wrapRef = useRef(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/dashboard', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (alive && d && d.messages) setMessages(d.messages); })
      .catch(() => {});
    return () => { alive = false; };
  }, [user.username]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const unread = messages.filter(m => m.id > seen).length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) playSound('ping');
    if (next && messages.length) {
      const maxId = Math.max(...messages.map(m => m.id));
      writeSeen(user.username, maxId);
      // keep the badge for this open so the user can see what was new
      setTimeout(() => setSeen(maxId), 600);
    }
  };

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notif-btn"
        onClick={toggle}
        aria-label={`Notifications${unread ? `, ${unread} new` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <i className="fas fa-bell"></i>
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel" role="menu">
          <div className="notif-head">
            <strong>Notifications</strong>
            <span>{messages.length} total</span>
          </div>
          <div className="notif-list">
            {messages.length === 0 ? (
              <div className="notif-empty"><i className="fas fa-bell-slash"></i> You&rsquo;re all caught up</div>
            ) : messages.map(m => (
              <div className={`notif-item ${m.id > seen ? 'is-new' : ''}`} key={m.id} role="menuitem">
                <div className="notif-item-title">{m.title}</div>
                <div className="notif-item-text">{m.content}</div>
                <div className="notif-item-time">{timeAgo(m.timestamp)}</div>
              </div>
            ))}
          </div>
          <Link to="/dashboard" className="notif-foot" onClick={() => setOpen(false)}>Open dashboard <i className="fas fa-arrow-right"></i></Link>
        </div>
      )}
    </div>
  );
}

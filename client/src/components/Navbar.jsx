import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import SoundToggle from './SoundToggle';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          {user && (
            <button className="sidebar-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
              <i className="fas fa-bars"></i>
            </button>
          )}
          <Link to="/" className="navbar-brand">
            <div className="navbar-crest">
              <i className="fas fa-university"></i>
            </div>
            VJTI Committee Manager
          </Link>
        </div>

        <div className="navbar-right">
          <SoundToggle />
          {user ? (
            <div className="navbar-user">
              {user.role === 'student' && <NotificationBell user={user} />}
              <div className="navbar-avatar">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <span className="navbar-username">{user.username}</span>
              <span className={`navbar-role navbar-role-${user.role}`}>{user.role}</span>
              <button className="navbar-logout" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-gold btn-sm">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

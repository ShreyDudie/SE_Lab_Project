import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="navbar-crest">
            <i className="fas fa-university"></i>
          </div>
          VJTI Committee Manager
        </Link>

        <div className="navbar-links">
          <Link to="/">Explore</Link>

          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <div className="navbar-user">
                <div className="navbar-avatar">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <button className="navbar-logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <Link to="/login" className="btn btn-gold btn-sm">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

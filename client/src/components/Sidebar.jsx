import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Close sidebar on route change (mobile)
  const handleNav = (path) => {
    navigate(path);
    if (window.innerWidth < 900) onClose();
  };

  if (!user) return null;

  const isStudent = user.role === 'student';
  const isHead = user.role === 'head';
  const isAdmin = user.role === 'admin';

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* User info card */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user.username}</p>
            <span className="sidebar-user-role">{user.role}</span>
          </div>
        </div>

        <div className="sidebar-divider"></div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Navigation</p>
          
          <button className="sidebar-link" onClick={() => handleNav('/dashboard')}>
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </button>

          {(isStudent || isAdmin) && (
            <button className="sidebar-link" onClick={() => handleNav('/')}>
              <i className="fas fa-compass"></i>
              <span>Explore Events</span>
            </button>
          )}

          {isHead && user.assigned_committee && (
            <button className="sidebar-link" onClick={() => handleNav(`/committee/${user.assigned_committee}`)}>
              <i className="fas fa-users-cog"></i>
              <span>My Committee</span>
            </button>
          )}

          <div className="sidebar-divider"></div>
          <p className="sidebar-section-label">Committees</p>

          <CommitteeLinks onNavigate={handleNav} />

          {isAdmin && (
            <>
              <div className="sidebar-divider"></div>
              <p className="sidebar-section-label">Administration</p>
              <button className="sidebar-link" onClick={() => handleNav('/dashboard')}>
                <i className="fas fa-shield-alt"></i>
                <span>Admin Console</span>
              </button>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <p>VJTI Committee Manager</p>
          <p className="sidebar-footer-sub">v2.0 — React + 3NF</p>
        </div>
      </aside>
    </>
  );
}

function CommitteeLinks({ onNavigate }) {
  const [committees, setCommittees] = useState([]);

  useEffect(() => {
    fetch('/api/committees', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { committees: [] })
      .then(d => setCommittees(d.committees || []))
      .catch(() => {});
  }, []);

  const icons = {
    'COC': 'fa-code',
    'Enthusia': 'fa-futbol',
    'Technovanza': 'fa-microchip',
    'Pratibimb': 'fa-palette'
  };

  return (
    <>
      {committees.map(c => (
        <button key={c.id} className="sidebar-link" onClick={() => onNavigate(`/committee/${c.id}`)}>
          <i className={`fas ${icons[c.name] || 'fa-flag'}`}></i>
          <span>{c.name}</span>
        </button>
      ))}
    </>
  );
}

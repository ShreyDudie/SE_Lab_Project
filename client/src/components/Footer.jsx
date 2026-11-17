import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCommitteeAccent } from '../utils/committeeThemes';

export default function Footer() {
  const { user } = useAuth();
  const [committees, setCommittees] = useState([]);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    fetch('/api/committees', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : { committees: [] }))
      .then(d => { if (alive) setCommittees(d.committees || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, [user]);

  return (
    <footer className="site-footer">
      <div className="site-footer-glow" aria-hidden="true"></div>
      <div className="site-footer-inner">
        <div className="footer-col footer-about">
          <div className="footer-logo">
            <img src="/favicon.svg" alt="" width="40" height="40" />
            <div>VJTI <span>Committee Manager</span></div>
          </div>
          <p>
            One home for every committee at Veermata Jijabai Technological Institute: discover events,
            register in a tap, and watch your branch climb the inter-branch leaderboard.
          </p>
          <div className="footer-social">
            <a href="https://vjti.ac.in" target="_blank" rel="noreferrer" aria-label="VJTI website" title="VJTI website"><i className="fas fa-globe"></i></a>
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram"><i className="fab fa-instagram"></i></a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn" title="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
            <a href="https://github.com/" target="_blank" rel="noreferrer" aria-label="GitHub" title="GitHub"><i className="fab fa-github"></i></a>
          </div>
        </div>

        <nav className="footer-col" aria-label="Committees">
          <h4>Committees</h4>
          {user && committees.length > 0 ? committees.map(c => (
            <Link key={c.id} to={`/committee/${c.id}`} className="footer-link">
              <span className="footer-dot" style={{ background: getCommitteeAccent(c.name) }}></span>{c.name}
            </Link>
          )) : (
            <>
              <span className="footer-link is-static"><span className="footer-dot" style={{ background: getCommitteeAccent('COC') }}></span>COC</span>
              <span className="footer-link is-static"><span className="footer-dot" style={{ background: getCommitteeAccent('Enthusia') }}></span>Enthusia</span>
              <span className="footer-link is-static"><span className="footer-dot" style={{ background: getCommitteeAccent('Technovanza') }}></span>Technovanza</span>
              <span className="footer-link is-static"><span className="footer-dot" style={{ background: getCommitteeAccent('Pratibimb') }}></span>Pratibimb</span>
            </>
          )}
        </nav>

        <nav className="footer-col" aria-label="Quick links">
          <h4>Quick links</h4>
          {user ? (
            <>
              {user.role === 'student' && <Link to="/" className="footer-link"><i className="fas fa-compass"></i> Explore events</Link>}
              <Link to="/dashboard" className="footer-link"><i className="fas fa-tachometer-alt"></i> Dashboard</Link>
            </>
          ) : (
            <Link to="/login" className="footer-link"><i className="fas fa-sign-in-alt"></i> Sign in</Link>
          )}
          <a href="https://vjti.ac.in" target="_blank" rel="noreferrer" className="footer-link"><i className="fas fa-external-link-alt"></i> VJTI.ac.in</a>
        </nav>

        <div className="footer-col">
          <h4>Find us</h4>
          <p className="footer-address">
            <i className="fas fa-map-marker-alt"></i>
            Veermata Jijabai Technological Institute,<br />
            H.R. Mahajani Road, Matunga (E),<br />
            Mumbai &ndash; 400019
          </p>
          <a
            className="footer-map-btn"
            href="https://www.google.com/maps/search/?api=1&query=Veermata+Jijabai+Technological+Institute+Matunga+Mumbai"
            target="_blank"
            rel="noreferrer"
          >
            <i className="fas fa-location-arrow"></i> Open in Maps
          </a>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>&copy; 2026 VJTI Committee Management System</span>
        <span className="footer-built">Built with <i className="fas fa-heart"></i> using React &amp; Flask</span>
      </div>
    </footer>
  );
}

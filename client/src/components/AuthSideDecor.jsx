import CommitteeLogo from './CommitteeLogo';
import { getCommitteeTheme, getCommitteeAccent } from '../utils/committeeThemes';

const NAMES = ['COC', 'Enthusia', 'Technovanza', 'Pratibimb'];

const FEATURES = [
  { icon: 'fa-compass', title: 'Discover events', text: 'Hackathons, RoboWars, sports and cultural nights in one place.' },
  { icon: 'fa-bolt', title: 'Register in a tap', text: 'Clash-free scheduling, so you never double-book a slot.' },
  { icon: 'fa-ticket-alt', title: 'Digital tickets', text: 'Entry passes and live updates from every committee.' },
  { icon: 'fa-trophy', title: 'Win for your branch', text: 'Every podium finish lifts your department up the leaderboard.' },
];

/**
 * Fillers for the empty sides of the sign-in / register page (wide screens only).
 * Left: what the platform offers. Right: the four committees.
 */
export default function AuthSideDecor() {
  return (
    <>
      <aside className="auth-side auth-side-left" aria-hidden="true">
        <span className="auth-eyebrow"><i className="fas fa-university"></i> Welcome to VJTI</span>
        <h2 className="auth-side-title">Your campus,<br />all in one hub.</h2>
        <ul className="auth-features">
          {FEATURES.map(f => (
            <li key={f.title}>
              <span className="auth-feature-icon"><i className={`fas ${f.icon}`}></i></span>
              <div>
                <strong>{f.title}</strong>
                <span>{f.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <aside className="auth-side auth-side-right" aria-hidden="true">
        <span className="auth-eyebrow">Four committees</span>
        <div className="auth-committees">
          {NAMES.map(n => {
            const theme = getCommitteeTheme(n);
            return (
              <div key={n} className="auth-committee" style={{ '--accent': getCommitteeAccent(n) }}>
                <CommitteeLogo committeeName={n} size={44} />
                <div>
                  <strong>{n}</strong>
                  <span>{theme?.tagline}</span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}

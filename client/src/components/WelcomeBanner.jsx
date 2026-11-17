import { useState } from 'react';
import { consumeWelcome } from '../utils/welcome';

/** One-time "thank you for joining" card shown on the first dashboard visit after signup. */
export default function WelcomeBanner({ username }) {
  const [role, setRole] = useState(() => consumeWelcome());
  if (!role) return null;

  const isHead = role === 'head';
  return (
    <div className="welcome-banner section-reveal" role="status">
      <div className="welcome-check"><i className="fas fa-check"></i></div>
      <div className="welcome-text">
        <strong>Thank you for joining, {username}!</strong>
        <span>
          {isHead
            ? 'Your Committee Head request has been submitted. An administrator will verify it shortly.'
            : 'Your account is ready. Browse upcoming events, register in a tap and earn points for your branch.'}
        </span>
      </div>
      <button type="button" className="welcome-close" onClick={() => setRole(null)} aria-label="Dismiss"><i className="fas fa-times"></i></button>
    </div>
  );
}

import { useState, useEffect } from 'react';

/**
 * Countdown Timer component for events.
 * Shows days/hours/minutes/seconds in a compact, non-intrusive format.
 * Only renders when event date is in the future.
 */
export default function CountdownTimer({ date, startTime, themed = false }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!date) return;

    const targetDate = new Date(`${date}T${startTime || '00:00'}:00`);

    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [date, startTime]);

  if (!timeLeft) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <i className="fas fa-stopwatch" style={{ marginRight: '6px', color: '#cbd5e1' }}></i> Starts in
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {timeLeft.days > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '0.2rem 0.5rem', minWidth: '40px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>{timeLeft.days}</span>
            <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#CBD5E1', letterSpacing: '0.1em' }}>D</span>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '0.2rem 0.5rem', minWidth: '40px' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>{String(timeLeft.hours).padStart(2, '0')}</span>
          <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#CBD5E1', letterSpacing: '0.1em' }}>H</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '0.2rem 0.5rem', minWidth: '40px' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#CBD5E1', letterSpacing: '0.1em' }}>M</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '0.2rem 0.5rem', minWidth: '40px' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#CBD5E1', letterSpacing: '0.1em' }}>S</span>
        </div>
      </div>
    </div>
  );
}

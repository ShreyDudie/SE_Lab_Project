import { useEffect, useRef, useState } from 'react';

/**
 * A big paper plane that swoops across the whole page, leaving a dashed trail.
 * Mount it (with a new `key`) each time a broadcast is sent; it removes itself when done.
 */
const DURATION = 2600;

const bez = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
};
const bezD = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return 3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2);
};
const ease = (t) => 0.5 - Math.cos(Math.PI * t) / 2;

export default function PaperPlaneFlight() {
  const planeRef = useRef(null);
  const trailRef = useRef(null);
  const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [done, setDone] = useState(!!reduce);

  useEffect(() => {
    if (reduce) return undefined;

    const W = window.innerWidth;
    const H = window.innerHeight;
    // S-shaped swoop: in from the bottom-left, dip, climb high, and exit top-right
    const X = [-200, W * 0.28, W * 0.5, W + 220];
    const Y = [H * 0.82, H * 1.02, H * -0.12, H * 0.14];

    const pts = [];
    let raf;
    const start = performance.now();

    const tick = (now) => {
      const raw = Math.min((now - start) / DURATION, 1);
      const t = ease(raw);
      const x = bez(X[0], X[1], X[2], X[3], t);
      const y = bez(Y[0], Y[1], Y[2], Y[3], t);
      const dx = bezD(X[0], X[1], X[2], X[3], t);
      const dy = bezD(Y[0], Y[1], Y[2], Y[3], t);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      // swells as it passes "close" to the viewer, shrinks as it flies off
      const scale = 0.75 + Math.sin(Math.PI * Math.min(raw * 1.05, 1)) * 0.75;
      // gentle banking
      const bank = Math.sin(raw * Math.PI * 3) * 9;

      if (planeRef.current) {
        planeRef.current.style.transform =
          `translate(${x - 90}px, ${y - 60}px) rotate(${angle + bank * 0.2}deg) scale(${scale})`;
        planeRef.current.style.opacity = raw > 0.97 ? String((1 - raw) / 0.03) : '1';
      }
      pts.push([x, y]);
      if (trailRef.current) {
        trailRef.current.setAttribute('d', 'M' + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L'));
      }
      if (raw < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setDone(true), 700); // let the trail fade out
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  if (done) return null;
  return (
    <div className="plane-layer" aria-hidden="true">
      <svg className="plane-trail" width="100%" height="100%">
        <path ref={trailRef} d="" />
      </svg>
      <div className="plane-big" ref={planeRef}>
        <svg viewBox="0 0 120 80" width="180" height="120">
          <polygon points="118,40 6,8 48,40" fill="#FFFFFF" />
          <polygon points="118,40 48,40 6,72" fill="#D9E1EE" />
          <polygon points="118,40 48,40 34,62" fill="#AEBBD0" />
          <polyline points="6,8 48,40 6,72" fill="none" stroke="#C5CFDF" strokeWidth="1" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

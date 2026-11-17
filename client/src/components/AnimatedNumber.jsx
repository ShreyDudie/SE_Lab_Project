import { useState, useEffect } from 'react';

/** Counts up to the given value once on mount (respects reduced-motion). */
export default function AnimatedNumber({ value = 0, duration = 900 }) {
  const reduce = typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduce || !value) return undefined;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce]);

  const display = (reduce || !value) ? value : shown;
  return <>{display.toLocaleString('en-IN')}</>;
}

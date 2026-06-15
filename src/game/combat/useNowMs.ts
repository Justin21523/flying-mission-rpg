import { useEffect, useState } from 'react';

// A low-frequency ticking clock for render — returns a perf-time (ms) state updated on an interval so
// time-dependent UI (cooldown fills, expiring debug volumes) re-renders without calling an impure function
// during render. performance.now() is read inside the interval effect (allowed), not in the render body.
export function useNowMs(intervalMs = 150): number {
  const [now, setNow] = useState(() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
  useEffect(() => {
    const id = window.setInterval(() => setNow(typeof performance !== 'undefined' ? performance.now() : Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

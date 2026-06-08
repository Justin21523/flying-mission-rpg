import { useEffect, useState } from 'react';

// Forces a re-render every `ms` (via a bumping counter). Use for HUD readouts of fast-changing store
// slices (clock minutes, player position) so they refresh a few times a second WITHOUT subscribing to
// a per-frame store update — that 60 Hz React churn beside the 3D canvas makes the editor panels lag.
export function usePoll(ms: number): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((v) => (v + 1) % 1_000_000), ms);
    return () => clearInterval(id);
  }, [ms]);
  return n;
}

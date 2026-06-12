import { useEffect } from 'react';
import { useAutoPlaytesterStore } from '../../stores/game/autoPlaytesterStore';
import { tickAutoPlaytester } from './autoPlaytesterRuntime';
import './e2eBridge'; // installs window.__aero (debug/test bridge) when bundled

// Batch 13 — ticks the AutoPlaytester on a timer while enabled (debug/test only). A timer (not useFrame) so
// it lives outside the Canvas and runs even between scene swaps; tick() no-ops unless a run is active.
export const AutoPlaytesterDirector = () => {
  const enabled = useAutoPlaytesterStore((s) => s.enabled);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => tickAutoPlaytester(), 100);
    return () => clearInterval(id);
  }, [enabled]);
  return null;
};

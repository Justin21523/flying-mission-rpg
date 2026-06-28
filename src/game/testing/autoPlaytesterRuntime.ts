import { AutoPlaytester } from './AutoPlaytester';
import type { AutoPlaytesterConfig } from './AutoPlaytesterConfig';
import { realWorld } from './AutoPlaytesterActions';
import { useAutoPlaytesterStore } from '../../stores/game/autoPlaytesterStore';

// Batch 13 — the singleton AutoPlaytester wired to the real game world, pushing snapshots to the panel
// store. Also exposes window.__autoPlaytester so Playwright can drive a core-flow run without touching game
// state directly. Debug/test only — never started by normal gameplay.

export const autoPlaytester = new AutoPlaytester(realWorld, (s) => useAutoPlaytesterStore.getState().setSnap(s));

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function startAutoPlaytester(overrides?: Partial<AutoPlaytesterConfig>): void {
  useAutoPlaytesterStore.getState().setEnabled(true);
  autoPlaytester.start(now(), overrides);
}
export function stopAutoPlaytester(): void {
  autoPlaytester.stop(now());
  useAutoPlaytesterStore.getState().setEnabled(false);
}
export function resetAutoPlaytester(): void {
  autoPlaytester.reset(now());
}
export function tickAutoPlaytester(): void {
  autoPlaytester.tick(now());
}

// Playwright / console hook.
declare global {
  interface Window {
    __autoPlaytester?: {
      start: (overrides?: Partial<AutoPlaytesterConfig>) => void;
      stop: () => void;
      reset: () => void;
      status: () => string;
      snapshot: () => ReturnType<typeof autoPlaytester.snapshot>;
    };
  }
}

if (typeof window !== 'undefined') {
  window.__autoPlaytester = {
    start: startAutoPlaytester,
    stop: stopAutoPlaytester,
    reset: resetAutoPlaytester,
    status: () => autoPlaytester.status,
    snapshot: () => autoPlaytester.snapshot(now()),
  };
}

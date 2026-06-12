import { gameEventBus } from '../core/EventBus';

// Batch 13 — tracks how long the game has sat in the current phase (a stuck FSM is a common runtime bug).
let lastChangeMs = nowMs();
let installed = false;
let off: (() => void) | null = null;

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function installStateMachineDiagnostics(): () => void {
  if (installed) return () => {};
  installed = true;
  lastChangeMs = nowMs();
  off = gameEventBus.on('phase:changed', () => { lastChangeMs = nowMs(); });
  return () => { off?.(); off = null; installed = false; };
}

export function getStuckMs(): number {
  return nowMs() - lastChangeMs;
}

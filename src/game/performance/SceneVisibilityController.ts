import { getAudioManager } from '../audio/AudioManager';

// Batch 12 — central gate for "should heavy ticks run right now?". When the tab is hidden or the game is
// paused, expensive per-frame work (flight event director, transformation effects, companion AI, weather
// particles) should early-return and non-essential audio loops pause. Existing useFrame ticks read
// `shouldTick()`; resume restores everything. Uses real-dt clamping at call sites so no FSM time jumps.

let hidden = false;
let paused = false;

function refreshAudio(): void {
  if (hidden || paused) getAudioManager().pauseNonEssential();
  else getAudioManager().resumeNonEssential();
}

/** True when heavy/non-essential per-frame work should run. */
export function shouldTick(): boolean {
  return !hidden && !paused;
}

export function setPaused(p: boolean): void {
  if (paused === p) return;
  paused = p;
  refreshAudio();
}

export function isPaused(): boolean {
  return paused;
}

/** Install the document visibility watcher. Returns a cleanup that removes the listener. */
export function installVisibilityWatcher(): () => void {
  if (typeof document === 'undefined') return () => {};
  const onChange = (): void => {
    hidden = document.visibilityState === 'hidden';
    refreshAudio();
  };
  document.addEventListener('visibilitychange', onChange);
  onChange();
  return () => document.removeEventListener('visibilitychange', onChange);
}

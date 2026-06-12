// Batch 12 — tiny typed event emitter so game systems can request audio without importing the manager
// (keeps the 3D/runtime layers decoupled from Howler). UiAudioController / FlightAudioController etc.
// subscribe and translate events into AudioManager calls. Listeners are always cleaned up by callers.

export type AudioEvent =
  | { type: 'ui'; cue: 'click' | 'hover' | 'confirm' | 'back' | 'select' | 'launch' }
  | { type: 'flight-cloud-break'; intensity: number }
  | { type: 'flight-boost'; on: boolean }
  | { type: 'flight-weather'; weather: string }
  | { type: 'transformation-stage'; stage: string }
  | { type: 'mission-complete' }
  | { type: 'support-arrived' };

type Listener = (e: AudioEvent) => void;

const listeners = new Set<Listener>();

export function onAudioEvent(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitAudioEvent(e: AudioEvent): void {
  for (const fn of listeners) {
    try {
      fn(e);
    } catch {
      /* a broken listener must never break the emitter */
    }
  }
}

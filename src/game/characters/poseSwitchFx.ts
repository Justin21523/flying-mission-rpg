// Post-content — a tiny event so switching a character's pose/model anywhere (the 🛩 Characters tab quick-
// switch, the transformation showcase) plays a flashy burst (energy ring + flash + sparkle) at the character.
// Decoupled: emitters call triggerPoseSwitchFx; the PoseSwitchFxLayer (mounted in scenes) renders the burst.
import { robotHandle } from '../destination/robotHandle';

export interface PoseSwitchEvent {
  characterId: string;
  assetId: string;
  position: [number, number, number];
  color?: string;
  t: number; // performance.now() when fired
}

type Listener = (e: PoseSwitchEvent) => void;
const listeners = new Set<Listener>();

export function onPoseSwitch(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function triggerPoseSwitchFx(characterId: string, assetId: string, position?: [number, number, number], color?: string): void {
  const pos = position ?? [robotHandle.pos.x, robotHandle.pos.y, robotHandle.pos.z];
  const e: PoseSwitchEvent = { characterId, assetId, position: pos, color, t: typeof performance !== 'undefined' ? performance.now() : Date.now() };
  for (const fn of listeners) {
    try { fn(e); } catch { /* a broken listener must never break the emitter */ }
  }
}

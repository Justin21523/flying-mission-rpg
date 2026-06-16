import { playEffect, cleanupEffectsForCaster, cleanupAllForPhaseChange, type CinematicCastContext } from './CinematicVfxDirector';
import { robotHandle } from '../destination/robotHandle';
import { getCloneAbility } from '../../stores/game/useCloneAbilityStore';

// Clone ability runtime (Batch F.7) — thin instrumentation over the cinematic VFX runtime. Clones cast through
// the normal arsenal path in combat; this module is the direct spawn/track/cleanup surface the Debug panel uses
// (cast a clone, count active clones, cleanup all) and the phase-change cleanup hook. The heavy lifting (pose
// model pooling, rendering, expiry) is done by the cinematic runtime + ModelParticleRenderer (reused).

const MAX_ACTIVE_CLONE_INSTANCES = 12;

interface CloneInstance { id: string; casterId: string; abilityId: string; endSec: number; }
const instances: CloneInstance[] = [];
let seq = 0;
const nowSec = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

function prune(): void {
  const t = nowSec();
  for (let i = instances.length - 1; i >= 0; i--) {
    if (t >= instances[i].endSec) instances.splice(i, 1);
  }
}

// Spawn a clone ability's effect at a context (defaults to the live player position). Returns the instance id,
// or null if the clone is unknown. Enforces a global active-instance cap (evicts the oldest when full).
export function spawnCloneAbility(characterId: string, abilityId: string, ctx?: Partial<CinematicCastContext>): string | null {
  const def = getCloneAbility(abilityId);
  if (!def) return null;
  prune();
  if (instances.length >= MAX_ACTIVE_CLONE_INSTANCES) instances.shift();
  const full: CinematicCastContext = {
    casterId: ctx?.casterId ?? characterId,
    x: ctx?.x ?? robotHandle.pos.x, y: ctx?.y ?? robotHandle.pos.y, z: ctx?.z ?? robotHandle.pos.z,
    heading: ctx?.heading ?? robotHandle.heading,
    targetId: ctx?.targetId,
  };
  playEffect(`${abilityId}_fx`, full);
  const id = `clone_${seq++}`;
  instances.push({ id, casterId: full.casterId ?? characterId, abilityId, endSec: nowSec() + Math.max(0.4, def.durationSeconds) });
  return id;
}

export function activeCloneCount(): number { prune(); return instances.length; }
export function clonePoolCapacity(): number { return MAX_ACTIVE_CLONE_INSTANCES; }

export function cleanupAllClonesForCaster(casterId: string): void {
  cleanupEffectsForCaster(casterId);
  for (let i = instances.length - 1; i >= 0; i--) if (instances[i].casterId === casterId) instances.splice(i, 1);
}

export function cleanupAllClonesForPhaseChange(): void {
  cleanupAllForPhaseChange();
  instances.length = 0;
}

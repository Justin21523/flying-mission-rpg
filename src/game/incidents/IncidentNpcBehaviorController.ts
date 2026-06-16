import type { IncidentPlan } from '../../types/aiIncidentTypes';
import { useIncidentNpcStateStore, type IncidentNpcRuntime } from '../../stores/useIncidentNpcStateStore';
import { activeSegment } from '../advanced-mission-zone/AdvancedMissionZoneDirector';
import { robotHandle } from '../destination/robotHandle';

// Incident NPC behavior (Batch H). Deterministic per-frame movement + state for the incident's virtual rescue
// subjects: panicked NPCs flee the danger, evacuating NPCs head to the nearest safe marker (→ safe on arrival),
// trapped/injured hold, panic spreads to nearby idle/waiting NPCs, and the player's proximity rescues them.
// Reuses the incident npc store; no other system is touched.
const FLEE_SPEED = 4, EVACUATE_SPEED = 3, RESCUE_R = 3.5, PANIC_SPREAD_R = 4, PANIC_THRESHOLD = 1.5, ARRIVE_DIST = 1.6;

const dist2 = (ax: number, az: number, bx: number, bz: number) => { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; };

function safeTarget(plan: IncidentPlan, pos: [number, number, number]): [number, number, number] {
  const markers = activeSegment()?.markers ?? [];
  let best: [number, number, number] | undefined; let bestD = Infinity;
  for (const m of markers) { const d = dist2(pos[0], pos[2], m.position[0], m.position[2]); if (d < bestD) { bestD = d; best = [m.position[0], pos[1], m.position[2]]; } }
  if (best) return best;
  // No marker → flee outward from the danger centre to the area edge.
  const c = plan.affectedArea.center;
  let dx = pos[0] - c[0], dz = pos[2] - c[2];
  const len = Math.hypot(dx, dz) || 1; dx /= len; dz /= len;
  const r = plan.affectedArea.radius + 4;
  return [c[0] + dx * r, pos[1], c[2] + dz * r];
}

export function tickNpcBehavior(plan: IncidentPlan, dt: number, nowMs: number): void {
  void nowMs;
  const store = useIncidentNpcStateStore.getState();
  const npcs = Object.values(store.npcs);
  const c = plan.affectedArea.center;
  const px = robotHandle.pos.x, pz = robotHandle.pos.z;

  for (const n of npcs) {
    let x = n.position[0]; const y = n.position[1]; let z = n.position[2];
    let state = n.state;
    let facing = n.facingRad;

    // Rescue interaction: the player being near transitions trapped → waiting → evacuating.
    if (dist2(x, z, px, pz) <= RESCUE_R * RESCUE_R) {
      if (state === 'trapped') state = 'waiting-rescue';
      else if (state === 'waiting-rescue' || state === 'panicked') state = 'evacuating';
    }

    if (state === 'panicked') {
      let dx = x - c[0], dz = z - c[2]; const len = Math.hypot(dx, dz) || 1; dx /= len; dz /= len;
      x += dx * FLEE_SPEED * dt; z += dz * FLEE_SPEED * dt; facing = Math.atan2(dx, dz);
    } else if (state === 'evacuating') {
      const tgt = safeTarget(plan, [x, y, z]);
      let dx = tgt[0] - x, dz = tgt[2] - z; const len = Math.hypot(dx, dz);
      if (len <= ARRIVE_DIST) { state = 'safe'; }
      else { dx /= len; dz /= len; x += dx * EVACUATE_SPEED * dt; z += dz * EVACUATE_SPEED * dt; facing = Math.atan2(dx, dz); }
    }
    // trapped / injured / waiting-rescue / safe / idle → hold position.

    store.setNpc(n.id, { position: [x, y, z], state, facingRad: facing });
  }

  // Panic spread: a panicked/trapped NPC raises panic in nearby idle/waiting NPCs over time.
  const fearSources = npcs.filter((n) => n.state === 'panicked' || n.state === 'trapped');
  for (const n of npcs) {
    if (n.state !== 'idle' && n.state !== 'waiting-rescue') continue;
    const near = fearSources.some((f) => f.id !== n.id && dist2(n.position[0], n.position[2], f.position[0], f.position[2]) <= PANIC_SPREAD_R * PANIC_SPREAD_R);
    if (!near) continue;
    const accum = (n.panicAccum ?? 0) + dt;
    if (accum >= PANIC_THRESHOLD) store.setNpc(n.id, { state: 'panicked', panicAccum: 0 });
    else store.setNpc(n.id, { panicAccum: accum });
  }
}

// Exposed for tests / tools.
export const NPC_BEHAVIOR_CONSTANTS = { FLEE_SPEED, EVACUATE_SPEED, RESCUE_R, PANIC_SPREAD_R, PANIC_THRESHOLD, ARRIVE_DIST };
export type { IncidentNpcRuntime };

import type { IncidentReaction } from '../../types/trafficIncident';

// Phase G4 — active NPC reaction sources placed by traffic scenarios (npcReaction actions). Nearby MovingNpcs
// consult this each frame and visibly react: watch (stop + face), approach (gather), or flee (back away).
// Cleared per scenario instance on resolve. Plain module arrays — no React, no per-frame allocation.
export type ReactionMode = 'watch' | 'approach' | 'flee';
interface Source { key: string; instanceId: string; areaId: string; x: number; z: number; mode: ReactionMode; radius: number }

const sources: Source[] = [];

const MODE: Record<IncidentReaction, ReactionMode | null> = {
  ignore: null, stopAndLook: 'watch', moveAway: 'flee', panic: 'flee', callRescue: 'approach',
  helpVictim: 'approach', blockArea: 'watch', warnOthers: 'watch', reroute: 'flee',
};
export function reactionModeFor(r: IncidentReaction): ReactionMode | null { return MODE[r]; }

export function addReactionSource(key: string, instanceId: string, areaId: string, x: number, z: number, mode: ReactionMode, radius: number): void {
  const i = sources.findIndex((s) => s.key === key);
  const src: Source = { key, instanceId, areaId, x, z, mode, radius };
  if (i >= 0) sources[i] = src; else sources.push(src);
}
export function clearReactionsForInstance(instanceId: string): void {
  for (let i = sources.length - 1; i >= 0; i--) if (sources[i].instanceId === instanceId) sources.splice(i, 1);
}

// Nearest reaction source affecting (x,z) in this area, or null. Writes nothing — returns a small record.
export function nearestReaction(areaId: string, x: number, z: number): { x: number; z: number; mode: ReactionMode; d: number } | null {
  let best: { x: number; z: number; mode: ReactionMode; d: number } | null = null;
  for (const s of sources) {
    if (s.areaId !== areaId) continue;
    const d = Math.hypot(s.x - x, s.z - z);
    if (d < s.radius && (!best || d < best.d)) best = { x: s.x, z: s.z, mode: s.mode, d };
  }
  return best;
}

import type { PathFollowerDef } from '../../types/pathFollower';

// Phase E — non-reactive runtime state for path followers (per copy): arc-length progress, current speed, the
// path each copy is on (may differ from the def after a reroute), and the last node index crossed (for branch
// detection). A plain module Map mutated outside React — no re-render, no per-frame allocation. Mirrors how
// trafficStore keeps vehicleProgress, but module-level since nothing subscribes to it.
export interface FollowerState {
  sig: string;        // `${pathId}#${count}` — reinit when the def's path or convoy size changes
  u: number[];        // progress 0..1 per copy
  curSpeed: number[]; // smoothed speed per copy
  pathId: string[];   // current path per copy (changes on reroute)
  lastNode: number[]; // last node index crossed per copy
}

const runtime = new Map<string, FollowerState>();

// Lazily create / resize a follower's runtime, spacing copies evenly around the loop on first init.
export function getFollowerState(def: PathFollowerDef): FollowerState {
  const sig = `${def.pathId}#${def.count}`;
  const cur = runtime.get(def.id);
  if (cur && cur.sig === sig) return cur;
  const count = Math.max(1, def.count);
  const fresh: FollowerState = {
    sig,
    u: Array.from({ length: count }, (_, i) => i / count),
    curSpeed: Array.from({ length: count }, () => 0),
    pathId: Array.from({ length: count }, () => def.pathId),
    lastNode: Array.from({ length: count }, () => -1),
  };
  runtime.set(def.id, fresh);
  return fresh;
}

export function dropFollowerState(id: string): void { runtime.delete(id); }

// Visit the progress of every active follower copy currently on `pathId` (for spacing). `cb(u)` per copy.
export function forEachOnPath(pathId: string, cb: (u: number) => void): void {
  for (const st of runtime.values()) {
    for (let i = 0; i < st.u.length; i++) if (st.pathId[i] === pathId) cb(st.u[i]);
  }
}

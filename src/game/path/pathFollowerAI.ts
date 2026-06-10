import { Vector3 } from 'three';
import type { PathFollowerDef } from '../../types/pathFollower';
import type { PathDefinition } from '../../types/path';
import { getPath } from '../../stores/editorPathStore';
import { useIncidentStore } from '../../stores/incidentStore';
import { useFlagStore } from '../../stores/flagStore';
import { usePlayerStore } from '../../stores/playerStore';
import { getCurve, samplePos, sampleTangent } from './pathCurve';
import { getFollowerState, forEachOnPath } from './followerRuntime';

// Phase E — the path-follower AI core. Per copy, per frame: obstacle sensor (look-ahead) + spacing + incident
// reaction + reroute, then advance arc-length progress. Module scratch vectors → zero per-frame allocation.
// Recoverable only: blocked followers slow/stop/reroute and resume; they are never deleted.
const _self = new Vector3();
const _tan = new Vector3();
const STOP_DIST = 1.0;   // hard stop within this many metres of a blocker
const LANE_HALF = 2.0;   // lateral half-width for "is it in my lane"

// Forward distance to a world point if it lies ahead within the lane corridor, else Infinity.
function blockerDist(sx: number, sz: number, tx: number, tz: number, px: number, pz: number, lookAhead: number): number {
  const dx = px - sx, dz = pz - sz;
  const forward = dx * tx + dz * tz;
  if (forward <= 0 || forward > lookAhead) return Infinity;
  const lateral = Math.abs(dx * -tz + dz * tx);
  return lateral > LANE_HALF ? Infinity : forward;
}

function tryReroute(def: PathFollowerDef, path: PathDefinition, fromNodeId: string): string | null {
  if (!def.canReroute || !path.branchRules) return null;
  const candidates = path.branchRules.filter((b) => b.fromNodeId === fromNodeId
    && (!b.requiredFlag || useFlagStore.getState().hasFlag(b.requiredFlag)));
  if (candidates.length === 0) return null;
  // Weighted pick (undefined weight = always-eligible weight 1).
  const total = candidates.reduce((s, b) => s + (b.weight ?? 1), 0);
  let r = Math.random() * total;
  for (const b of candidates) { r -= (b.weight ?? 1); if (r <= 0) return b.toPathId; }
  return candidates[0].toPathId;
}

// Advance one copy. Returns true if it has a valid curve (so the layer can place it), false to hide it.
export function advanceFollower(def: PathFollowerDef, i: number, dt: number): boolean {
  const state = getFollowerState(def);
  let path = getPath(state.pathId[i]);
  let cc = path ? getCurve(path) : null;
  if (!path || !cc) return false;

  const length = Math.max(0.001, cc.length);
  const u = state.u[i];
  samplePos(cc.curve, u, _self);
  sampleTangent(cc.curve, u, _tan);
  const sx = _self.x, sz = _self.z;
  const tx = _tan.x, tz = _tan.z;

  // Desired speed scaled by the nearest node's local multiplier.
  const nodes = path.nodes ?? [];
  const nodeIdx = nodes.length > 1 ? Math.min(nodes.length - 1, Math.max(0, Math.round(u * (nodes.length - 1)))) : 0;
  const desired = def.speed * (nodes[nodeIdx]?.speedMultiplier ?? 1);

  // ── Nearest blocker ahead = min over player / other followers on this path / active incidents. ──
  let nearest = Infinity;
  const pp = usePlayerStore.getState().position;
  if (pp) nearest = Math.min(nearest, blockerDist(sx, sz, tx, tz, pp.x, pp.z, def.lookAhead));

  forEachOnPath(state.pathId[i], (ou) => {
    if (ou === u) return; // skip self (same progress)
    samplePos(cc!.curve, ou, _self); // reuse scratch (sx/sz already captured)
    const d = blockerDist(sx, sz, tx, tz, _self.x, _self.z, def.lookAhead + def.minGap);
    // Keep a min gap to the one ahead: treat it as a blocker starting at minGap.
    if (d !== Infinity) nearest = Math.min(nearest, Math.max(STOP_DIST, d - def.minGap + STOP_DIST));
  });

  let incidentBlocked = false;
  if (def.yieldToIncidents) {
    for (const inc of useIncidentStore.getState().getActiveForArea(def.areaId)) {
      const m = inc.markerPosition;
      const d = blockerDist(sx, sz, tx, tz, m[0], m[2], def.lookAhead);
      if (d !== Infinity) { nearest = Math.min(nearest, d); incidentBlocked = true; }
    }
  }

  // Blocker distance → target speed (linear brake; hard stop within STOP_DIST).
  let target = desired;
  if (nearest <= STOP_DIST) target = 0;
  else if (nearest < def.lookAhead) target = desired * Math.max(0, (nearest - STOP_DIST) / (def.lookAhead - STOP_DIST));

  // ── Reroute: at a freshly-crossed branch node, or when blocked (esp. by an incident) and a branch exists. ──
  const crossedNode = nodeIdx !== state.lastNode[i];
  if (def.canReroute && (crossedNode || target === 0 || incidentBlocked)) {
    const fromId = nodes[nodeIdx]?.id;
    if (fromId) {
      const to = tryReroute(def, path, fromId);
      if (to && getPath(to)) {
        state.pathId[i] = to;
        state.u[i] = 0;
        state.lastNode[i] = -1;
        path = getPath(to)!;
        cc = getCurve(path);
        return !!cc; // settle on the new path next frame
      }
    }
  }
  state.lastNode[i] = nodeIdx;

  // Smooth toward the target speed, then advance arc-length progress.
  state.curSpeed[i] += (target - state.curSpeed[i]) * Math.min(1, dt * 4);
  let nu = u + (state.curSpeed[i] * dt) / length;
  if (nu >= 1) { if (def.loop || path.closed) nu -= 1; else { nu = 1; state.curSpeed[i] = 0; } }
  state.u[i] = nu;
  return true;
}

// Sample a copy's current world pose for rendering (after advanceFollower). Writes pos + returns heading yaw.
export function followerPose(def: PathFollowerDef, i: number, outPos: Vector3): number {
  const state = getFollowerState(def);
  const path = getPath(state.pathId[i]);
  const cc = path ? getCurve(path) : null;
  if (!cc) return 0;
  samplePos(cc.curve, state.u[i], outPos);
  sampleTangent(cc.curve, state.u[i], _tan);
  return Math.atan2(_tan.x, _tan.z);
}

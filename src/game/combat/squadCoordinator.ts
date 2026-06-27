import type { CombatTarget } from '../../stores/game/combatTargetStore';
import { getSpawnGroup } from '../../stores/game/editorCombatStore';

// Wave 2 — Squad coordinator. A light per-frame pass that reads each spawn group's optional squadPolicy and
// applies a small role-based positional nudge so a group reads as a coordinated squad (ranged hang back,
// healers retreat, flankers drift to a side) ON TOP of each enemy's own AI. It only nudges — it never takes
// over movement — so it composes with the archetype state machines and the generic chase/kite loop.

const NUDGE = 0.06; // per-frame drift magnitude (units)
const RANGED_IDEAL = 14;
const HEALER_IDEAL = 18;
const FLANK_IDEAL = 10;

export type SquadRole = 'melee-swarm' | 'ranged-keep-distance' | 'healer-stay-back' | 'flank';

function awayFrom(e: CombatTarget, px: number, pz: number, dist: number, mult = 1): void {
  if (dist < 0.001) return;
  e.x += ((e.x - px) / dist) * NUDGE * mult;
  e.z += ((e.z - pz) / dist) * NUDGE * mult;
}
function toward(e: CombatTarget, px: number, pz: number, dist: number, mult = 1): void {
  if (dist < 0.001) return;
  e.x -= ((e.x - px) / dist) * NUDGE * mult;
  e.z -= ((e.z - pz) / dist) * NUDGE * mult;
}

// Apply one role's spacing nudge. Exposed for unit tests.
export function applyRoleNudge(e: CombatTarget, role: SquadRole, px: number, pz: number): void {
  const dist = Math.hypot(e.x - px, e.z - pz);
  switch (role) {
    case 'ranged-keep-distance':
      if (dist < RANGED_IDEAL) awayFrom(e, px, pz, dist);
      break;
    case 'healer-stay-back':
      if (dist < HEALER_IDEAL) awayFrom(e, px, pz, dist, 1.4);
      break;
    case 'flank': {
      // Drift perpendicular to the player line (to a side/back) while closing if far.
      if (dist > 0.001) {
        const perpX = -(e.z - pz) / dist, perpZ = (e.x - px) / dist;
        e.x += perpX * NUDGE; e.z += perpZ * NUDGE;
        if (dist > FLANK_IDEAL) toward(e, px, pz, dist, 0.5);
      }
      break;
    }
    case 'melee-swarm':
      // Encourage closing the gap so the swarm collapses onto the player.
      toward(e, px, pz, dist, 0.6);
      break;
  }
}

export function applySquadTactics(targets: CombatTarget[], px: number, pz: number): void {
  // Group living, group-tagged enemies by their spawn group.
  const groups = new Map<string, CombatTarget[]>();
  for (const t of targets) {
    if (!t.isEnemy || t.defeatedAt || !t.spawnGroupId) continue;
    const arr = groups.get(t.spawnGroupId);
    if (arr) arr.push(t); else groups.set(t.spawnGroupId, [t]);
  }
  for (const [gid, members] of groups) {
    const policy = getSpawnGroup(gid)?.squadPolicy;
    if (!policy || policy.enabled === false || !policy.roles?.length) continue;
    const roleByDef = new Map(policy.roles.map((r) => [r.enemyDefinitionId, r.role as SquadRole]));
    for (const e of members) {
      const role = e.enemyDefId ? roleByDef.get(e.enemyDefId) : undefined;
      if (role) applyRoleNudge(e, role, px, pz);
    }
  }
}

import { getEditorMission } from '../../../stores/game/editorMissionStore';
import { useMissionStore } from '../../../stores/game/useMissionStore';
import { getDestinationParts } from '../../../stores/game/editorDestinationStore';
import { getEditorGameNpcs } from '../../../stores/game/editorGameNpcStore';
import { abilitySupportsObjective } from '../../missions/missionAssist';
import type { MissionObjective } from '../../../types/game/mission';
import type { SupportDispatchProfile } from '../../../types/game/support';

// Resolve where an AI companion should physically GO to work an objective: the bound destination part (carry →
// its dropoff zone, find/activate/reach → the target part) or the talk NPC. Pure reads from the editable stores.
export interface ObjectiveTarget {
  objectiveId: string;
  x: number;
  z: number;
  targetCount: number;
}

function objectiveWorldPos(o: MissionObjective): { x: number; z: number } | null {
  const parts = getDestinationParts().filter((p) => p.enabled);
  const ids = o.targetObjectIds ?? [];
  if (o.kind === 'carry' && o.dropoffZoneId) {
    const d = parts.find((p) => p.id === o.dropoffZoneId);
    if (d) return { x: d.position[0], z: d.position[2] };
  }
  if (o.kind === 'talk') {
    const npc = getEditorGameNpcs().find((n) => n.position && ids.includes(n.id));
    if (npc?.position) return { x: npc.position[0], z: npc.position[2] };
  }
  for (const id of ids) {
    const p = parts.find((q) => q.id === id);
    if (p) return { x: p.position[0], z: p.position[2] };
  }
  return null;
}

// The nearest incomplete objective this companion's abilities suit + has a world position + isn't already
// claimed by another companion this tick. Returns null when there's nothing for it to do (→ follow the player).
export function pickObjectiveTarget(profile: SupportDispatchProfile, from: { x: number; z: number }, claimed: ReadonlySet<string>): ObjectiveTarget | null {
  const runtime = useMissionStore.getState().runtime;
  const mission = runtime ? getEditorMission(runtime.missionId) : undefined;
  if (!runtime || !mission) return null;
  let best: ObjectiveTarget | null = null;
  let bestD = Infinity;
  for (const o of mission.objectives) {
    if (runtime.objectiveProgress[o.id]?.done) continue;
    if (claimed.has(o.id)) continue;
    if (o.kind === 'hunt') continue; // hunts are their own mini-game, not an AI walk-up task
    if (!profile.abilities.some((a) => abilitySupportsObjective(a, o.kind))) continue;
    const pos = objectiveWorldPos(o);
    if (!pos) continue;
    const d = (pos.x - from.x) ** 2 + (pos.z - from.z) ** 2;
    if (d < bestD) { bestD = d; best = { objectiveId: o.id, x: pos.x, z: pos.z, targetCount: o.targetCount }; }
  }
  return best;
}

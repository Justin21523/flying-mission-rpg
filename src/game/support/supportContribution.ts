import type { FullControlDispatchContext, SupportAbilityTag } from '../../types/game/support';
import type { MissionRuntime, MissionObjectiveKind } from '../../types/game/mission';
import { getEditorMission } from '../../stores/game/editorMissionStore';
import { getSupportProfileForCharacter } from '../../stores/game/editorSupportStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';

// Post-13 — a dispatched full-control support character makes a REAL contribution at the destination: it
// completes one mission objective its abilities are suited to (preferring an ability-matched objective kind,
// else the first outstanding one), recorded onto the ORIGIN mission runtime so it survives the arrival restore.

const ABILITY_KINDS: Record<SupportAbilityTag, MissionObjectiveKind[]> = {
  engineering: ['activate'], repair: ['activate'], rescue: ['carry', 'reach'], transport: ['carry'],
  scouting: ['find', 'reach'], search: ['find'], medical: ['reach', 'talk'], water: ['carry', 'activate'],
  'air-control': ['reach'], speed: ['carry', 'reach'], 'heavy-lift': ['carry'],
};

function supportedKinds(abilities: SupportAbilityTag[]): Set<MissionObjectiveKind> {
  const out = new Set<MissionObjectiveKind>();
  for (const a of abilities) for (const k of ABILITY_KINDS[a] ?? []) out.add(k);
  return out;
}

/** Pure picker: first outstanding objective ability-matched, else first outstanding. Testable. */
export function pickObjectiveId(objectives: { id: string; kind: MissionObjectiveKind }[], doneIds: Set<string>, abilities: SupportAbilityTag[]): string | null {
  const outstanding = objectives.filter((o) => !doneIds.has(o.id));
  if (outstanding.length === 0) return null;
  const kinds = supportedKinds(abilities);
  return (outstanding.find((o) => kinds.has(o.kind)) ?? outstanding[0]).id;
}

/** First outstanding objective id this character is suited to (reads the mission definition). */
export function pickContributionObjectiveId(missionId: string | null, runtime: MissionRuntime, abilities: SupportAbilityTag[]): string | null {
  const def = missionId ? getEditorMission(missionId) : undefined;
  if (!def) return null;
  const done = new Set(Object.entries(runtime.objectiveProgress).filter(([, v]) => v.done).map(([k]) => k));
  return pickObjectiveId(def.objectives, done, abilities);
}

export interface ContributionResult {
  runtime: MissionRuntime;
  label: string;
}

/** Returns an updated origin runtime with one objective marked done + a human label, or null if nothing to do. */
export function applyContribution(context: FullControlDispatchContext): ContributionResult | null {
  const runtime = context.originMissionRuntime;
  if (!runtime) return null;
  const profile = getSupportProfileForCharacter(context.dispatchCharacterId);
  const objId = pickContributionObjectiveId(context.originMissionId, runtime, profile?.abilities ?? []);
  if (!objId) return null;
  const prev = runtime.objectiveProgress[objId] ?? { done: false, count: 0 };
  const updated: MissionRuntime = {
    ...runtime,
    objectiveProgress: { ...runtime.objectiveProgress, [objId]: { ...prev, done: true, count: Math.max(1, prev.count) } },
  };
  const name = getEditorCharacter(context.dispatchCharacterId)?.name ?? context.dispatchCharacterId;
  return { runtime: updated, label: `${name} completed an objective` };
}

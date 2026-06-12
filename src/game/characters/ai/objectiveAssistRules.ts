import { getEditorMission } from '../../../stores/game/editorMissionStore';
import { useMissionStore } from '../../../stores/game/useMissionStore';
import { useSupportRuntimeStore } from '../../../stores/game/supportRuntimeStore';
import { abilitySupportsObjective } from '../../missions/missionAssist';
import type { MissionObjective, MissionObjectiveKind } from '../../../types/game/mission';
import type { SupportAbilityTag, SupportDispatchProfile } from '../../../types/game/support';

export interface ObjectiveAssistRule {
  id: string;
  objectiveKind: MissionObjectiveKind;
  requiredAbilities: SupportAbilityTag[];
  contributionScore: number;
  allowAiComplete: boolean;
}

export interface ObjectiveAssistEvent {
  characterId: string;
  objectiveId: string;
  ruleId: string;
  completed: boolean;
  contributionScore: number;
  message: string;
}

const RULES: readonly ObjectiveAssistRule[] = [
  { id: 'assist_repair_device', objectiveKind: 'activate', requiredAbilities: ['engineering', 'repair'], contributionScore: 3, allowAiComplete: true },
  { id: 'assist_find_item', objectiveKind: 'find', requiredAbilities: ['scouting', 'search', 'speed'], contributionScore: 2, allowAiComplete: true },
  { id: 'assist_carry_item', objectiveKind: 'carry', requiredAbilities: ['transport', 'heavy-lift', 'rescue'], contributionScore: 2, allowAiComplete: true },
  { id: 'assist_talk_npc', objectiveKind: 'talk', requiredAbilities: ['rescue', 'medical'], contributionScore: 1, allowAiComplete: true },
  { id: 'assist_reach_marker', objectiveKind: 'reach', requiredAbilities: ['speed', 'air-control'], contributionScore: 1, allowAiComplete: true },
];

export function resolveObjectiveAssistRule(profile: SupportDispatchProfile, objective: MissionObjective): ObjectiveAssistRule | null {
  const rule = RULES.find((item) => item.objectiveKind === objective.kind && item.requiredAbilities.some((ability) => profile.abilities.includes(ability)));
  if (rule) return rule;
  if (profile.abilities.some((ability) => abilitySupportsObjective(ability, objective.kind))) {
    return {
      id: `assist_${objective.kind}_fallback`,
      objectiveKind: objective.kind,
      requiredAbilities: profile.abilities.filter((ability) => abilitySupportsObjective(ability, objective.kind)),
      contributionScore: 1,
      allowAiComplete: false,
    };
  }
  return null;
}

export function applyCompanionObjectiveAssist(characterId: string, objectiveId: string, profile: SupportDispatchProfile): ObjectiveAssistEvent | null {
  const runtime = useMissionStore.getState().runtime;
  const mission = runtime ? getEditorMission(runtime.missionId) : undefined;
  const objective = mission?.objectives.find((item) => item.id === objectiveId);
  if (!runtime || !objective) return null;
  const rule = resolveObjectiveAssistRule(profile, objective);
  if (!rule) return null;
  const prevDone = !!runtime.objectiveProgress[objectiveId]?.done;
  const completed = rule.allowAiComplete && !prevDone;
  if (completed) useMissionStore.getState().setObjective(objectiveId, true, objective.targetCount);
  const message = `${characterId} assisted ${objective.kind}`;
  useSupportRuntimeStore.getState().updatePresence(characterId, {
    contributionScore: (useSupportRuntimeStore.getState().presences.find((p) => p.characterId === characterId)?.contributionScore ?? 0) + rule.contributionScore,
    missionContribution: `${rule.contributionScore} pts · ${objective.kind}`,
    assistRuleId: rule.id,
    lastTaskResult: completed ? 'completed objective' : 'added assist progress',
  });
  return {
    characterId,
    objectiveId,
    ruleId: rule.id,
    completed,
    contributionScore: rule.contributionScore,
    message,
  };
}

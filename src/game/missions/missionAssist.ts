import type { SupportAbilityTag, SupportAssistEvent } from '../../types/game/support';
import type { MissionObjective, MissionObjectiveKind } from '../../types/game/mission';
import { useMissionStore } from '../../stores/game/useMissionStore';

export function abilitySupportsObjective(ability: SupportAbilityTag, kind: MissionObjectiveKind): boolean {
  if (kind === 'activate') return ability === 'engineering' || ability === 'repair';
  if (kind === 'find') return ability === 'scouting' || ability === 'search' || ability === 'speed';
  if (kind === 'carry') return ability === 'transport' || ability === 'heavy-lift' || ability === 'rescue';
  if (kind === 'talk') return ability === 'rescue' || ability === 'medical';
  return ability === 'speed' || ability === 'air-control';
}

export function createAssistEvent(characterId: string, objective: MissionObjective, ability: SupportAbilityTag): SupportAssistEvent | null {
  if (!abilitySupportsObjective(ability, objective.kind)) return null;
  return {
    characterId,
    objectiveKind: objective.kind,
    objectiveId: objective.id,
    ability,
    progress: objective.allowAiAssistComplete ? 1 : 0.35,
    canComplete: !!objective.allowAiAssistComplete,
  };
}

export function applyAssistEvent(event: SupportAssistEvent): void {
  if (!event.objectiveId || !event.canComplete) return;
  useMissionStore.getState().setObjective(event.objectiveId, true, 1);
}

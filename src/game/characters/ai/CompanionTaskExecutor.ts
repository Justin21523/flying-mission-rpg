import { getEditorMission } from '../../../stores/game/editorMissionStore';
import { useMissionStore } from '../../../stores/game/useMissionStore';
import { createAssistEvent } from '../../missions/missionAssist';
import type { MissionObjective } from '../../../types/game/mission';
import type { SupportAbilityTag, SupportDispatchProfile } from '../../../types/game/support';
import type { SupportAssistEvent } from '../../../types/game/support';

export interface CompanionTask {
  objective: MissionObjective;
  ability: SupportAbilityTag;
  canComplete: boolean;
  event: SupportAssistEvent;
}

export function pickCompanionTask(profile: SupportDispatchProfile): CompanionTask | null {
  const runtime = useMissionStore.getState().runtime;
  const mission = runtime ? getEditorMission(runtime.missionId) : undefined;
  if (!runtime || !mission) return null;
  for (const objective of mission.objectives) {
    const progress = runtime.objectiveProgress[objective.id];
    if (progress?.done) continue;
    for (const ability of profile.abilities) {
      const event = createAssistEvent(profile.characterId, objective, ability);
      if (event) return { objective, ability, canComplete: event.canComplete, event };
    }
  }
  return null;
}

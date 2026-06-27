import type { StageDefinition } from '../../types/stageTypes';
import type { StageRuntimeState } from '../../types/stageProgressionTypes';

export function isStageClear(stage: StageDefinition, state: StageRuntimeState): boolean {
  return stage.clearRules.every((rule) => {
    if (rule.type === 'all-objectives-complete') return stage.objectiveIds.every((id) => state.completedObjectiveIds.includes(id));
    if (rule.type === 'complete-objective') return state.completedObjectiveIds.includes(rule.objectiveId);
    if (rule.type === 'complete-segment') return state.activeSegmentId === rule.segmentId || state.completedObjectiveIds.includes(`segment:${rule.segmentId}`);
    if (rule.type === 'complete-encounter') return state.completedEncounterIds.includes(rule.encounterId);
    if (rule.type === 'resolve-incident') return state.completedIncidentIds.includes(rule.incidentId);
    if (rule.type === 'defeat-boss') return !state.activeBossId || state.completedObjectiveIds.includes(`boss:${rule.bossId}`);
    if (rule.type === 'debug-force-clear') return !!state.debug?.allowForceClear;
    return false;
  });
}

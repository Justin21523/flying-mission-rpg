import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

export function completeStageObjective(objectiveId: string): void {
  useStageProgressionStore.getState().completeObjective(objectiveId);
}

export function failStageObjective(objectiveId: string): void {
  useStageProgressionStore.getState().failObjective(objectiveId);
}

import type { EnemyEncounterDefinition } from '../../types/encounterTypes';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { getEncountersForStage } from '../../stores/useEncounterEditorStore';
import { areEncounterGroupsCleared, spawnEncounterWave } from './EncounterWaveController';

let activeStageId: string | undefined;
let stageEncounters: EnemyEncounterDefinition[] = [];

export function initializeEncounters(stageId: string): EnemyEncounterDefinition[] {
  activeStageId = stageId;
  stageEncounters = getEncountersForStage(stageId);
  return stageEncounters;
}

export function getInitializedEncounters(): EnemyEncounterDefinition[] {
  return stageEncounters;
}

export function triggerEncounter(encounterId: string, originX = 0, originZ = 0): boolean {
  const encounter = stageEncounters.find((item) => item.id === encounterId) ?? getEncountersForStage(activeStageId ?? '').find((item) => item.id === encounterId);
  if (!encounter) return false;
  spawnEncounterWave(encounter.enemySpawnGroupIds, originX, originZ);
  useStageProgressionStore.getState().activateEncounter(encounter.id);
  return true;
}

export function onSegmentEnter(segmentId: string, originX = 0, originZ = 0): string[] {
  const triggered: string[] = [];
  for (const encounter of stageEncounters) {
    if (encounter.segmentId === segmentId && encounter.trigger.type === 'on-segment-enter') {
      if (triggerEncounter(encounter.id, originX, originZ)) triggered.push(encounter.id);
    }
  }
  return triggered;
}

export function updateEncounterClearState(): string[] {
  const completed: string[] = [];
  const store = useStageProgressionStore.getState();
  for (const encounter of stageEncounters) {
    if (store.completedEncounterIds.includes(encounter.id)) continue;
    if (areEncounterGroupsCleared(encounter.enemySpawnGroupIds)) {
      store.completeEncounter(encounter.id);
      completed.push(encounter.id);
    }
  }
  return completed;
}

export function cleanupEncounters(): void {
  activeStageId = undefined;
  stageEncounters = [];
}

import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { MissionDefinition } from '../../types/game/mission';
import { SEED_MISSIONS } from '../../data/game/missions';

export const useEditorMissionStore = createEditorCollection<MissionDefinition>({
  storageKey: 'aero-rescue-editor-mission-v1',
  seed: SEED_MISSIONS,
  makeId: () => `mission_${nanoid(6)}`,
});

export function getEditorMissions(): MissionDefinition[] {
  return useEditorMissionStore.getState().items;
}
export function getEditorMission(id: string): MissionDefinition | undefined {
  return useEditorMissionStore.getState().items.find((m) => m.id === id);
}

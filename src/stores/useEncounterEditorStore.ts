import { nanoid } from 'nanoid';
import { createEditorCollection } from './game/createEditorCollection';
import type { EncounterPackDefinition, EnemyEncounterDefinition } from '../types/encounterTypes';
import { SEED_ENCOUNTER_PACKS } from '../data/encounters/encounterPacks';
import { SEED_ENEMY_ENCOUNTERS } from '../data/encounters/enemyEncounterDefinitions';

export const useEncounterPackStore = createEditorCollection<EncounterPackDefinition>({
  storageKey: 'aero-rescue-editor-encounter-packs-v1',
  seed: SEED_ENCOUNTER_PACKS,
  makeId: () => `pack_${nanoid(6)}`,
});

export const useEnemyEncounterStore = createEditorCollection<EnemyEncounterDefinition>({
  storageKey: 'aero-rescue-editor-enemy-encounters-v1',
  seed: SEED_ENEMY_ENCOUNTERS,
  makeId: () => `enc_${nanoid(6)}`,
});

export function getEncounterPack(id: string): EncounterPackDefinition | undefined {
  return useEncounterPackStore.getState().items.find((pack) => pack.id === id);
}

export function getEnemyEncounter(id: string): EnemyEncounterDefinition | undefined {
  return useEnemyEncounterStore.getState().items.find((encounter) => encounter.id === id);
}

export function getEncountersForStage(stageId: string): EnemyEncounterDefinition[] {
  return useEnemyEncounterStore.getState().items.filter((encounter) => encounter.stageId === stageId);
}

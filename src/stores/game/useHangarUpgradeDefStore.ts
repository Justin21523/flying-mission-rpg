import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { HangarUpgradeDefinition } from '../../types/game/hangarUpgrade';
import { SEED_HANGAR_UPGRADES } from '../../data/progression/hangarUpgrades';

// Batch L — editable Hangar upgrade definitions (🛠 Hangar tab). Player purchases live in useHangarUpgradeStore.
export const useHangarUpgradeDefStore = createEditorCollection<HangarUpgradeDefinition>({
  storageKey: 'aero-rescue-hangar-upgrade-def-v1',
  seed: SEED_HANGAR_UPGRADES,
  makeId: () => `hangar_${nanoid(6)}`,
});

export function getHangarUpgradeDefs(): HangarUpgradeDefinition[] {
  return useHangarUpgradeDefStore.getState().items;
}
export function getHangarUpgradeDef(id: string): HangarUpgradeDefinition | undefined {
  return useHangarUpgradeDefStore.getState().items.find((d) => d.id === id);
}

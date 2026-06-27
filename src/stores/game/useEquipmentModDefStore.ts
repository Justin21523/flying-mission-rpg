import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { EquipmentModDefinition } from '../../types/game/equipmentMod';
import { SEED_EQUIPMENT_MODS } from '../../data/progression/equipmentMods';

// Wave 3 — editable equipment-mod catalog (⬆ Progression tab).
export const useEquipmentModDefStore = createEditorCollection<EquipmentModDefinition>({
  storageKey: 'aero-rescue-equipment-mod-def-v1',
  seed: SEED_EQUIPMENT_MODS,
  makeId: () => `mod_${nanoid(6)}`,
});

export function getEquipmentModDef(id: string): EquipmentModDefinition | undefined {
  return useEquipmentModDefStore.getState().items.find((m) => m.id === id);
}

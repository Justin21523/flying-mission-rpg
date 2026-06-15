import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { AbilityLoadoutDefinition } from '../../types/abilityArsenalTypes';
import { SEED_ABILITY_LOADOUTS } from '../../data/character-abilities/arsenalKits';

// Per-character ability loadout (Batch F.5) — which arsenal abilities sit on the keyed slots + ultimate.
// Seed-merged at boot; editable in the Loadout tab; debug-switchable.
export const useAbilityLoadoutStore = createEditorCollection<AbilityLoadoutDefinition>({
  storageKey: 'aero-rescue-editor-ability-loadout-v1',
  seed: SEED_ABILITY_LOADOUTS,
  makeId: () => `loadout_${nanoid(6)}`,
});

export function getLoadout(characterId: string | undefined): AbilityLoadoutDefinition | undefined {
  if (!characterId) return undefined;
  return useAbilityLoadoutStore.getState().items.find((l) => l.characterId === characterId);
}

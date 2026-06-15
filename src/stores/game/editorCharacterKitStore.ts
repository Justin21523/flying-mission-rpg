import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { CharacterCombatKitDefinition } from '../../types/game/characterKit';
import { SEED_CHARACTER_KITS } from '../../data/character-skills/characterCombatKits';
import { NEW_CHARACTER_KITS } from '../../data/character-abilities/arsenalKits';

// Editable character combat kits (🦸 Character Kits tab). id === characterId. Seed-merged at boot. Batch F.5
// adds arsenal-derived kits for the 4 new heroes alongside the 4 Batch-D MVP kits (all 8 playable).
export const useEditorCharacterKitStore = createEditorCollection<CharacterCombatKitDefinition>({
  storageKey: 'aero-rescue-editor-character-kit-v1',
  seed: [...SEED_CHARACTER_KITS, ...NEW_CHARACTER_KITS],
  makeId: () => `kit_${nanoid(6)}`,
});

export function getCharacterKits(): CharacterCombatKitDefinition[] {
  return useEditorCharacterKitStore.getState().items;
}
export function getKitForCharacter(characterId: string | undefined): CharacterCombatKitDefinition | undefined {
  if (!characterId) return undefined;
  return useEditorCharacterKitStore.getState().items.find((k) => k.characterId === characterId);
}

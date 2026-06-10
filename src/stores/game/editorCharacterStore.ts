import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { CharacterDefinition } from '../../types/game/character';
import { SEED_CHARACTERS } from '../../data/game/characters';

export const useEditorCharacterStore = createEditorCollection<CharacterDefinition>({
  storageKey: 'aero-rescue-editor-character-v3',
  seed: SEED_CHARACTERS,
  makeId: () => `char_${nanoid(6)}`,
});

export function getEditorCharacters(): CharacterDefinition[] {
  return useEditorCharacterStore.getState().items;
}
export function getEditorCharacter(id: string): CharacterDefinition | undefined {
  return useEditorCharacterStore.getState().items.find((c) => c.id === id);
}

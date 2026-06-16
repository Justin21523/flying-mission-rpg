import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { CloneAbilityDefinition } from '../../types/cloneAbilityTypes';
import { SEED_CLONE_ABILITIES } from '../../data/character-abilities/allCharacterAbilities';

// Editable clone-ability definitions (Batch F.7, 🌀 Clone Abilities tab). 4 per hero = 32. Reconciled at boot;
// the runtime resolves a clone's pose set / timeline / visual config from here.
export const useCloneAbilityStore = createEditorCollection<CloneAbilityDefinition>({
  storageKey: 'aero-rescue-editor-clone-ability-v1',
  seed: SEED_CLONE_ABILITIES,
  makeId: () => `clone_${nanoid(6)}`,
  seedVersion: 'f7-16-skills',
});

const SEED_BY_ID = new Map(SEED_CLONE_ABILITIES.map((c) => [c.id, c]));

// Resolve a clone definition by its ability id (always available — falls back to the authored seed).
export function getCloneAbility(abilityId: string | undefined): CloneAbilityDefinition | undefined {
  if (!abilityId) return undefined;
  return useCloneAbilityStore.getState().items.find((c) => c.id === abilityId) ?? SEED_BY_ID.get(abilityId);
}
export function cloneAbilitiesForCharacter(characterId: string | undefined): CloneAbilityDefinition[] {
  if (!characterId) return [];
  return useCloneAbilityStore.getState().items.filter((c) => c.characterId === characterId);
}

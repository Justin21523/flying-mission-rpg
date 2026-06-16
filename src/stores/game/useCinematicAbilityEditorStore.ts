import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { CinematicAbilityDefinition } from '../../types/abilityArsenalTypes';
import { SEED_ARSENAL_ABILITIES } from '../../data/character-abilities/allCharacterAbilities';

// Editable cinematic ability arsenal (🎬 Cinematic Abilities tab). Reconciled at boot — Batch F.6 grows the
// roster to 12/hero (adds the signature utility) and adds visualScale, so returning users must refresh the
// seed-owned abilities (the paged runtime resolves abilities by slot from this store).
export const useCinematicAbilityEditorStore = createEditorCollection<CinematicAbilityDefinition>({
  storageKey: 'aero-rescue-editor-cinematic-ability-v2',
  seed: SEED_ARSENAL_ABILITIES,
  makeId: () => `ability_${nanoid(6)}`,
  seedVersion: 'f7-16-skills',
});

export function getCinematicAbility(id: string | undefined): CinematicAbilityDefinition | undefined {
  if (!id) return undefined;
  return useCinematicAbilityEditorStore.getState().items.find((a) => a.id === id);
}
export function cinematicAbilitiesForCharacter(characterId: string | undefined): CinematicAbilityDefinition[] {
  if (!characterId) return [];
  return useCinematicAbilityEditorStore.getState().items.filter((a) => a.characterId === characterId);
}
export function getAbilityBySlot(characterId: string | undefined, abilitySlot: CinematicAbilityDefinition['abilitySlot']): CinematicAbilityDefinition | undefined {
  if (!characterId) return undefined;
  return useCinematicAbilityEditorStore.getState().items.find((a) => a.characterId === characterId && a.abilitySlot === abilitySlot);
}

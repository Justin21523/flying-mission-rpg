import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { SupportCombatAbilityDefinition, PartnerSynergyPlaceholderDefinition } from '../../types/game/supportCombat';
import { SEED_SUPPORT_ABILITIES } from '../../data/support-combat/supportCombatAbilities';
import { SEED_SUPPORT_SYNERGIES } from '../../data/support-combat/supportSynergyPlaceholders';

// Editable support-combat abilities + synergies (🤝 Support Combat tab). Seed-merged at boot.
export const useSupportCombatEditorStore = createEditorCollection<SupportCombatAbilityDefinition>({
  storageKey: 'aero-rescue-editor-support-combat-v1',
  seed: SEED_SUPPORT_ABILITIES,
  makeId: () => `support_ability_${nanoid(6)}`,
});

export const useSupportSynergyEditorStore = createEditorCollection<PartnerSynergyPlaceholderDefinition>({
  storageKey: 'aero-rescue-editor-support-synergy-v1',
  seed: SEED_SUPPORT_SYNERGIES,
  makeId: () => `synergy_${nanoid(6)}`,
});

export function getSupportAbility(id: string | undefined): SupportCombatAbilityDefinition | undefined {
  if (!id) return undefined;
  return useSupportCombatEditorStore.getState().items.find((a) => a.id === id);
}

export function getSupportAbilitiesForCharacter(characterId: string | undefined): SupportCombatAbilityDefinition[] {
  if (!characterId) return [];
  return useSupportCombatEditorStore.getState().items.filter((a) => a.supportCharacterId === characterId && a.enabled !== false);
}

export function getSupportSynergies(): PartnerSynergyPlaceholderDefinition[] {
  return useSupportSynergyEditorStore.getState().items;
}

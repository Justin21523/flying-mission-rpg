import { describe, it, expect, beforeEach } from 'vitest';
import { castSupportAbility, registerSupportCharacter } from '../../game/support-combat/SupportCombatDirector';
import { useSupportCombatStore } from '../../stores/game/useSupportCombatStore';
import { useSupportCombatEditorStore, useSupportSynergyEditorStore } from '../../stores/game/useSupportCombatEditorStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { SEED_SUPPORT_ABILITIES } from '../../data/support-combat/supportCombatAbilities';
import { SEED_SUPPORT_SYNERGIES } from '../../data/support-combat/supportSynergyPlaceholders';
import type { CharacterPresence } from '../../types/game/support';

const presence = (characterId: string): CharacterPresence => ({
  characterId, tier: 'active', aiState: 'idle', position: [0, 0, 0], heading: 0, controllerActive: false, colliderActive: true,
});

beforeEach(() => {
  useSupportCombatEditorStore.getState().importState({ items: SEED_SUPPORT_ABILITIES, seeded: true });
  useSupportSynergyEditorStore.getState().importState({ items: SEED_SUPPORT_SYNERGIES, seeded: true });
  useSupportCombatStore.getState().resetSupportCombat();
  useSupportRuntimeStore.getState().reset();
  useSupportRuntimeStore.getState().upsertPresence(presence('char_paul'));
});

describe('support resources', () => {
  it('blocks a cast when support energy is insufficient', () => {
    registerSupportCharacter('char_paul');
    useSupportCombatStore.getState().setSupportEnergy('char_paul', 5); // shield costs 25
    const res = castSupportAbility('support_shield_paul');
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('low energy');
  });

  it('debug ignoreSupportCost bypasses the energy check', () => {
    registerSupportCharacter('char_paul');
    useSupportCombatStore.getState().setSupportEnergy('char_paul', 5);
    useSupportCombatStore.getState().setDebugFlag('ignoreSupportCost', true);
    expect(castSupportAbility('support_shield_paul').ok).toBe(true);
  });

  it('a successful cast deducts the support energy cost', () => {
    registerSupportCharacter('char_paul');
    useSupportCombatStore.getState().setSupportEnergy('char_paul', 100);
    expect(castSupportAbility('support_shield_paul').ok).toBe(true);
    expect(useSupportCombatStore.getState().runtimeBySupportCharacterId['char_paul'].supportEnergy).toBe(75);
  });
});

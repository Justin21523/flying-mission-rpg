import { describe, it, expect, beforeEach } from 'vitest';
import { castSupportAbility } from '../../game/support-combat/SupportCombatDirector';
import { useSupportCombatStore } from '../../stores/game/useSupportCombatStore';
import { useSupportCombatEditorStore, useSupportSynergyEditorStore } from '../../stores/game/useSupportCombatEditorStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { SEED_SUPPORT_ABILITIES } from '../../data/support-combat/supportCombatAbilities';
import { SEED_SUPPORT_SYNERGIES } from '../../data/support-combat/supportSynergyPlaceholders';
import type { CharacterPresence } from '../../types/game/support';

// Paul's Shield Support (targetType player → no enemy needed); an active presence makes it usable so the
// real cooldown/cost gates apply.
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

describe('support cooldown', () => {
  it('a cast puts the ability on cooldown and blocks an immediate re-cast', () => {
    expect(castSupportAbility('support_shield_paul').ok).toBe(true);
    const second = castSupportAbility('support_shield_paul');
    expect(second.ok).toBe(false);
    expect(second.reason).toBe('cooldown');
  });

  it('debug ignoreSupportCooldown allows back-to-back casts', () => {
    expect(castSupportAbility('support_shield_paul').ok).toBe(true);
    useSupportCombatStore.getState().setDebugFlag('ignoreSupportCooldown', true);
    expect(castSupportAbility('support_shield_paul').ok).toBe(true);
  });
});

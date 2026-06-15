import { describe, it, expect } from 'vitest';
import { validateAbility, validateTargeting, validateEffect, validateSynergy } from '../../game/support-combat/SupportCombatValidation';
import { SEED_SUPPORT_ABILITIES } from '../../data/support-combat/supportCombatAbilities';
import { SEED_SUPPORT_SYNERGIES } from '../../data/support-combat/supportSynergyPlaceholders';
import { SEED_SUPPORT_EFFECTS } from '../../data/support-combat/supportVisualEffects';
import { MODEL_ASSETS } from '../../data/modelLibrary';
import type { SupportCombatAbilityDefinition } from '../../types/game/supportCombat';

const effectIds = new Set(SEED_SUPPORT_EFFECTS.map((e) => e.id));
const visualExists = (id: string) => effectIds.has(id);

describe('SupportCombatValidation', () => {
  it('every seeded ability + synergy validates', () => {
    for (const a of SEED_SUPPORT_ABILITIES) expect(validateAbility(a, visualExists).ok, a.id).toBe(true);
    for (const s of SEED_SUPPORT_SYNERGIES) expect(validateSynergy(s).ok, s.id).toBe(true);
  });

  it('rejects a negative cooldown', () => {
    const bad = { ...SEED_SUPPORT_ABILITIES[0], cooldownSeconds: -1 } as SupportCombatAbilityDefinition;
    expect(validateAbility(bad, visualExists).ok).toBe(false);
  });

  it('rejects manual-target with targetType none', () => {
    expect(validateTargeting({ targetType: 'none', rangeShape: 'single' }, 'manual-target').ok).toBe(false);
  });

  it('rejects a damage effect missing its damageType', () => {
    expect(validateEffect({ id: 'e', effectType: 'damage', amount: 10, attackTags: ['x'] }, visualExists).ok).toBe(false);
    expect(validateEffect({ id: 'e', effectType: 'damage', amount: 10, damageType: 'impact', attackTags: ['x'] }, visualExists).ok).toBe(true);
  });

  it('rejects a synergy missing supportCharacterId', () => {
    const bad = { ...SEED_SUPPORT_SYNERGIES[0], supportCharacterId: '' };
    expect(validateSynergy(bad).ok).toBe(false);
  });

  it('every ability visual + spawn model resolves', () => {
    const models = new Set<string>();
    for (const a of SEED_SUPPORT_ABILITIES) {
      for (const e of a.effects) {
        if (e.modelFirstEffect) expect(visualExists(e.modelFirstEffect.effectDefinitionId), `${a.id}/${e.id}`).toBe(true);
        if (e.spawnModelAssetId) models.add(e.spawnModelAssetId);
      }
    }
    const missing = [...models].filter((m) => !MODEL_ASSETS[m]);
    expect(missing, `missing models: ${missing.join(', ')}`).toEqual([]);
  });
});

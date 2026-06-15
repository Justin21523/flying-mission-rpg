import { describe, it, expect } from 'vitest';
import { validateCombatStats, validateSkill, validateDamageable, validateCombatEffect, validateHitVolume } from './CombatValidation';
import type { CombatStatsPreset, CombatSkillDefinition, DamageableDefinition, CombatEffectDefinition } from '../../types/game/combat';

const stats = (patch: Partial<CombatStatsPreset> = {}): CombatStatsPreset => ({
  id: 's', characterId: 'default', maxHp: 100, maxShield: 50, shieldRegenPerSecond: 5, shieldRegenDelaySeconds: 3,
  maxEnergy: 100, energyRegenPerSecond: 8, staggerResistance: 0, moveSpeedMultiplier: 1, ...patch,
});

const skill = (patch: Partial<CombatSkillDefinition> = {}): CombatSkillDefinition => ({
  id: 'sk', name: 'S', skillType: 'basic', inputBinding: 'KeyJ', energyCost: 0, cooldownSeconds: 1,
  hitVolume: { id: 'hv', shape: 'cone', origin: 'character-forward', radius: 4, angleDegrees: 90, activeDurationSeconds: 0.2 },
  targetRules: { validTargetTypes: ['dummy'] }, ...patch,
});

describe('CombatValidation', () => {
  it('accepts valid stats; rejects non-positive maxHp', () => {
    expect(validateCombatStats(stats()).ok).toBe(true);
    expect(validateCombatStats(stats({ maxHp: 0 })).ok).toBe(false);
  });

  it('rejects a skill with empty input binding or negative cooldown', () => {
    expect(validateSkill(skill()).ok).toBe(true);
    expect(validateSkill(skill({ inputBinding: '' })).ok).toBe(false);
    expect(validateSkill(skill({ cooldownSeconds: -1 })).ok).toBe(false);
  });

  it('flags a skill whose effectDefinitionId does not resolve', () => {
    const res = validateSkill(skill({ effectDefinitionId: 'nope' }), () => undefined);
    expect(res.ok).toBe(false);
  });

  it('rejects a hit volume with non-positive active duration', () => {
    expect(validateHitVolume({ id: 'h', shape: 'sphere', origin: 'character-root', radius: 3, activeDurationSeconds: 0 }).ok).toBe(false);
  });

  it('validates damageables and warns on conflicting tags', () => {
    const d: DamageableDefinition = { id: 'd', maxHp: 50, weaknessTags: ['energy'], resistanceTags: ['energy'], onHpZero: 'destroy' };
    const res = validateDamageable(d);
    expect(res.ok).toBe(true);
    expect(res.warnings.length).toBeGreaterThan(0);
    expect(validateDamageable({ ...d, maxHp: 0 }).ok).toBe(false);
  });

  it('requires geometry for geometry-range effects', () => {
    const e: CombatEffectDefinition = { id: 'fx', effectType: 'geometry-range', timing: { startDelaySeconds: 0, durationSeconds: 0.5 }, cleanup: { releaseToPool: true, destroyOnComplete: false } };
    expect(validateCombatEffect(e).ok).toBe(false);
    expect(validateCombatEffect({ ...e, geometry: { geometryType: 'cone', dimensions: { radius: 4 }, renderMode: 'transparent', animate: 'sweep' } }).ok).toBe(true);
  });
});

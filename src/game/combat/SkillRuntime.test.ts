import { describe, it, expect } from 'vitest';
import { castSkill, type SkillCaster, type SkillCastDeps } from './SkillRuntime';
import type { CombatSkillDefinition, CombatStats, DamageableDefinition, DamageResult } from '../../types/game/combat';

const skill: CombatSkillDefinition = {
  id: 'sk',
  name: 'Test',
  skillType: 'special',
  inputBinding: 'KeyJ',
  energyCost: 25,
  cooldownSeconds: 2,
  damageEvents: [{ amount: 20, damageType: 'energy', attackTags: ['energy'] }],
  hitVolume: { id: 'hv', shape: 'sphere', origin: 'character-root', radius: 6, activeDurationSeconds: 0.2 },
  targetRules: { validTargetTypes: ['dummy'] },
  effectDefinitionId: 'fx',
};

const caster: SkillCaster = { characterId: 'char_jett', x: 0, y: 0, z: 0, headingRad: 0 };

const dummyDef: DamageableDefinition = { id: 'd1', maxHp: 100, weaknessTags: ['energy'], resistanceTags: [], onHpZero: 'destroy' };

function makeDeps(over: Partial<SkillCastDeps> = {}): { deps: SkillCastDeps; state: { energy: number; cooldowns: Record<string, number>; vitals: { hp: number; shield: number }; results: DamageResult[]; effectPlayed: boolean } } {
  const state = {
    energy: 100,
    cooldowns: {} as Record<string, number>,
    vitals: { hp: 100, shield: 0 },
    results: [] as DamageResult[],
    effectPlayed: false,
  };
  const stats: CombatStats = {
    maxHp: 100, hp: 100, maxShield: 0, shield: 0, shieldRegenPerSecond: 0, shieldRegenDelaySeconds: 0,
    maxEnergy: 100, energy: state.energy, staggerResistance: 0, energyRegenPerSecond: 0, moveSpeedMultiplier: 1, invulnerable: false, downed: false,
  };
  const deps: SkillCastDeps = {
    nowMs: 1000,
    ignoreEnergyCost: false,
    ignoreCooldown: false,
    cooldowns: state.cooldowns,
    getStats: () => ({ ...stats, energy: state.energy }),
    setEnergy: (_id, energy) => { state.energy = energy; },
    startCooldown: (id, until) => { state.cooldowns[id] = until; },
    getTargets: () => [{ id: 'd1', x: 1, y: 0, z: 1, definitionId: 'd1' }],
    getDamageable: () => dummyDef,
    getVitals: () => state.vitals,
    applyResult: (r) => { state.vitals.hp = Math.max(0, state.vitals.hp - r.hpDamage); },
    pushDamageResult: (r) => { state.results.push(r); },
    playEffect: () => { state.effectPlayed = true; },
    ...over,
  };
  return { deps, state };
}

describe('castSkill', () => {
  it('spends energy, starts cooldown, hits the target, plays the effect', () => {
    const { deps, state } = makeDeps();
    const out = castSkill(skill, caster, deps);
    expect(out.ok).toBe(true);
    expect(state.energy).toBe(75);
    expect(state.cooldowns['sk']).toBe(1000 + 2000);
    expect(out.hitIds).toEqual(['d1']);
    expect(out.results[0].wasWeaknessHit).toBe(true);
    expect(out.results[0].hpDamage).toBe(30); // 20 * 1.5 weakness
    expect(state.effectPlayed).toBe(true);
  });

  it('blocks when energy is insufficient (no spend)', () => {
    const { deps, state } = makeDeps();
    state.energy = 10;
    const out = castSkill(skill, caster, deps);
    expect(out.ok).toBe(false);
    expect(out.reason).toBe('energy');
    expect(state.energy).toBe(10);
  });

  it('blocks while on cooldown', () => {
    const { deps } = makeDeps({ cooldowns: { sk: 5000 }, nowMs: 1000 });
    const out = castSkill(skill, caster, deps);
    expect(out.ok).toBe(false);
    expect(out.reason).toBe('cooldown');
  });

  it('ignoreEnergyCost + ignoreCooldown bypass both gates', () => {
    const { deps, state } = makeDeps({ ignoreEnergyCost: true, ignoreCooldown: true, cooldowns: { sk: 9999 } });
    state.energy = 0;
    const out = castSkill(skill, caster, deps);
    expect(out.ok).toBe(true);
    expect(state.energy).toBe(0); // not spent
  });
});

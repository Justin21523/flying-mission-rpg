import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorCombatSkillStore, useEditorDamageableStore, getCombatSkill, getDamageable, getCombatStatsPreset, useEditorCombatStatsStore } from './editorCombatStore';
import { SEED_COMBAT_SKILLS } from '../../data/combat/defaultSkills';

beforeEach(() => {
  useEditorCombatSkillStore.getState().reset();
  useEditorDamageableStore.getState().reset();
  useEditorCombatStatsStore.getState().reset();
});

describe('editorCombatStore', () => {
  it('seed-merge is idempotent for skills', () => {
    useEditorCombatSkillStore.getState().mergeMissingFromSeed();
    const n = useEditorCombatSkillStore.getState().items.length;
    expect(n).toBe(SEED_COMBAT_SKILLS.length);
    useEditorCombatSkillStore.getState().mergeMissingFromSeed();
    expect(useEditorCombatSkillStore.getState().items.length).toBe(n);
  });

  it('create / update / duplicate / remove a skill', () => {
    const s = useEditorCombatSkillStore.getState();
    s.upsert({ id: 'sk_x', name: 'X', skillType: 'basic', inputBinding: 'KeyJ', energyCost: 0, cooldownSeconds: 1, hitVolume: { id: 'hv', shape: 'sphere', origin: 'character-root', radius: 3, activeDurationSeconds: 0.2 }, targetRules: { validTargetTypes: ['dummy'] } });
    expect(getCombatSkill('sk_x')?.name).toBe('X');
    useEditorCombatSkillStore.getState().update('sk_x', { name: 'Y' });
    expect(getCombatSkill('sk_x')?.name).toBe('Y');
    const dup = useEditorCombatSkillStore.getState().duplicate('sk_x');
    expect(dup).toBeTruthy();
    expect(useEditorCombatSkillStore.getState().items).toHaveLength(2);
    useEditorCombatSkillStore.getState().remove('sk_x');
    expect(getCombatSkill('sk_x')).toBeUndefined();
  });

  it('damageable accessor finds a target', () => {
    useEditorDamageableStore.getState().upsert({ id: 'd1', maxHp: 50, weaknessTags: [], resistanceTags: [], onHpZero: 'destroy' });
    expect(getDamageable('d1')?.maxHp).toBe(50);
  });

  it('getCombatStatsPreset falls back to default', () => {
    useEditorCombatStatsStore.getState().mergeMissingFromSeed();
    expect(getCombatStatsPreset('char_jett')?.characterId).toBe('char_jett');
    expect(getCombatStatsPreset('char_unknown')?.characterId).toBe('default');
  });
});

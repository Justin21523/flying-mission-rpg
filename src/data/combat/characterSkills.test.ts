import { describe, it, expect } from 'vitest';
import { SEED_CHARACTER_SKILLS } from './characterSkills';
import { SEED_ENEMY_SKILLS } from './enemySkills';
import { MODEL_ASSETS } from '../modelLibrary';
import { SPAWN_ATTACK_TYPES, DEFENSE_TYPES } from '../../types/game/combat';

const HEROES = ['char_jett', 'char_donnie', 'char_paul', 'char_todd', 'char_chase', 'char_jerome', 'char_bello', 'char_flip'];

describe('character skill catalog', () => {
  it('gives every hero a 6-slot skill set', () => {
    for (const h of HEROES) {
      const set = SEED_CHARACTER_SKILLS.filter((s) => s.ownerCharacterId === h);
      expect(set.length, h).toBeGreaterThanOrEqual(6);
      expect(new Set(set.map((s) => s.slot)).size, `${h} slots`).toBeGreaterThanOrEqual(6);
    }
  });

  it('every referenced model assetId exists in the library', () => {
    const all = [...SEED_CHARACTER_SKILLS, ...SEED_ENEMY_SKILLS];
    const ids = new Set<string>();
    for (const s of all) {
      for (const m of [s.modelPrefabId, s.projectilePrefabId, s.summonPrefabId, s.impactEffectPrefabId, s.projectile?.modelAssetId, s.summon?.modelAssetId, s.terrain?.modelAssetId]) {
        if (m) ids.add(m);
      }
    }
    const missing = [...ids].filter((id) => !MODEL_ASSETS[id]);
    expect(missing, `missing models: ${missing.join(', ')}`).toEqual([]);
  });

  it('meets the per-type minimums (>=5 each of defense / summon / terrain / ranged / melee / aoe)', () => {
    const all = [...SEED_CHARACTER_SKILLS, ...SEED_ENEMY_SKILLS];
    const count = (pred: (s: typeof all[number]) => boolean) => all.filter(pred).length;
    expect(count((s) => !!s.defenseType && DEFENSE_TYPES.includes(s.defenseType) && s.defenseType !== 'none')).toBeGreaterThanOrEqual(5);
    expect(count((s) => s.attackType === 'summon')).toBeGreaterThanOrEqual(5);
    expect(count((s) => s.terrain != null || s.attackType === 'terrain' || s.attackType === 'trap' || s.attackType === 'dot-zone')).toBeGreaterThanOrEqual(5);
    expect(count((s) => !!s.attackType && SPAWN_ATTACK_TYPES.includes(s.attackType) && (s.attackType === 'projectile' || s.attackType === 'homing' || s.attackType === 'lobbed'))).toBeGreaterThanOrEqual(5);
    expect(count((s) => s.attackType === 'melee' || s.attackType === 'charge' || s.attackType === 'heavy')).toBeGreaterThanOrEqual(5);
    expect(count((s) => s.attackType === 'ring-aoe' || s.attackType === 'fan' || s.attackType === 'shockwave' || s.attackType === 'dot-zone')).toBeGreaterThanOrEqual(5);
  });
});

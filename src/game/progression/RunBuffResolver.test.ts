import { describe, it, expect, beforeEach } from 'vitest';
import { getRunBuffMultipliers } from './RunBuffResolver';
import { useRunBuffStore } from '../../stores/game/useRunBuffStore';
import { useRunBuffDefStore } from '../../stores/game/useRunBuffDefStore';
import { useRunRecordStore } from '../../stores/game/useRunRecordStore';
import { SEED_RUN_BUFFS } from '../../data/progression/runBuffs';

beforeEach(() => {
  useRunBuffDefStore.getState().importState({ items: SEED_RUN_BUFFS });
  useRunBuffStore.getState().resetRun();
  useRunRecordStore.getState().reset();
});

describe('RunBuffResolver', () => {
  it('neutral with no buffs', () => {
    expect(getRunBuffMultipliers()).toEqual({ damageMult: 1, cooldownMult: 1, energyMult: 1 });
  });

  it('damage buff stacks additively; cooldown/energy reduce (clamped)', () => {
    useRunBuffStore.getState().addBuff('buff_power'); // +0.2 dmg
    useRunBuffStore.getState().addBuff('buff_power'); // +0.2 dmg again (stacks)
    useRunBuffStore.getState().addBuff('buff_rapid'); // -0.15 cd
    const m = getRunBuffMultipliers();
    expect(m.damageMult).toBeCloseTo(1.4, 5);
    expect(m.cooldownMult).toBeCloseTo(0.85, 5);
    expect(m.energyMult).toBe(1);
  });

  it('cooldown reduction clamps at 0.2 even with heavy stacking', () => {
    for (let i = 0; i < 20; i++) useRunBuffStore.getState().addBuff('buff_rapid');
    expect(getRunBuffMultipliers().cooldownMult).toBe(0.2);
  });

  it('stat-category buffs do not affect cast multipliers', () => {
    useRunBuffStore.getState().addBuff('buff_armor'); // maxHp
    expect(getRunBuffMultipliers()).toEqual({ damageMult: 1, cooldownMult: 1, energyMult: 1 });
  });
});

describe('useRunRecordStore', () => {
  it('keeps the max round per mode', () => {
    useRunRecordStore.getState().record('endless', 7);
    useRunRecordStore.getState().record('endless', 4);
    useRunRecordStore.getState().record('roguelite', 12);
    expect(useRunRecordStore.getState().getBest('endless')).toBe(7);
    expect(useRunRecordStore.getState().getBest('roguelite')).toBe(12);
  });
});

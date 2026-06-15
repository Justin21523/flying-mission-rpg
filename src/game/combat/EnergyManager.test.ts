import { describe, it, expect } from 'vitest';
import { canAfford, spendEnergy, regenEnergy } from './EnergyManager';
import type { CombatStats } from '../../types/game/combat';

const stats = (energy: number): CombatStats => ({
  maxHp: 100, hp: 100, maxShield: 0, shield: 0, shieldRegenPerSecond: 0, shieldRegenDelaySeconds: 0,
  maxEnergy: 100, energy, energyRegenPerSecond: 10, staggerResistance: 0, moveSpeedMultiplier: 1, invulnerable: false, downed: false,
});

describe('EnergyManager', () => {
  it('affords only when enough energy', () => {
    expect(canAfford(stats(30), 25)).toBe(true);
    expect(canAfford(stats(20), 25)).toBe(false);
  });

  it('ignoreEnergyCost always affords and never spends', () => {
    expect(canAfford(stats(0), 50, true)).toBe(true);
    expect(spendEnergy(stats(40), 50, true)).toBe(40);
  });

  it('spends energy clamped at 0', () => {
    expect(spendEnergy(stats(40), 25)).toBe(15);
    expect(spendEnergy(stats(10), 25)).toBe(0);
  });

  it('regenerates toward max', () => {
    expect(regenEnergy(stats(50), 1)).toBe(60);
    expect(regenEnergy(stats(98), 1)).toBe(100);
    expect(regenEnergy(stats(50), 1, true)).toBe(100);
  });
});

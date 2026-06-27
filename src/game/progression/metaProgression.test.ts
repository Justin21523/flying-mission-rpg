import { describe, it, expect, beforeEach } from 'vitest';
import { useCharacterProgressionStore } from '../../stores/game/useCharacterProgressionStore';
import { useSkillUpgradeStore } from '../../stores/game/useSkillUpgradeStore';
import { useSkillUpgradeCurveStore } from '../../stores/game/useSkillUpgradeCurveStore';
import { useEditorCombatSkillStore } from '../../stores/game/editorCombatStore';
import { useHangarUpgradeDefStore } from '../../stores/game/useHangarUpgradeDefStore';
import { useHangarUpgradeStore } from '../../stores/game/useHangarUpgradeStore';
import { useWalletStore } from '../../stores/walletStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useCombatTargetStore, liveTargets, type CombatTarget } from '../../stores/game/combatTargetStore';
import { SEED_SKILL_UPGRADE_CURVE } from '../../data/progression/skillUpgradeCurve';
import { SEED_HANGAR_UPGRADES } from '../../data/progression/hangarUpgrades';
import {
  availablePoints, getSkillMultipliers, getSkillLevel, canUpgrade, tryUpgradeSkill, cumulativeCost,
} from './SkillUpgradeResolver';
import { getHangarBonuses, tryPurchase, canPurchase } from './HangarBonusResolver';
import type { CombatSkillDefinition } from '../../types/game/combat';
import type { DamageResult } from '../../types/game/combat';

const CHAR = 'char_test';
const skill = (id: string): CombatSkillDefinition => ({
  id, name: id, ownerCharacterId: CHAR, faction: 'player', slot: 1, energyCost: 10, cooldownSeconds: 2,
  hitVolume: { id: 'hv', shape: 'sphere', origin: 'character-root', activeDurationSeconds: 0.2 },
  targetRules: {}, damageEvents: [{ amount: 20, damageType: 'impact', attackTags: [] }], enabled: true,
} as unknown as CombatSkillDefinition);

beforeEach(() => {
  useSkillUpgradeCurveStore.getState().importState({ items: SEED_SKILL_UPGRADE_CURVE });
  useHangarUpgradeDefStore.getState().importState({ items: SEED_HANGAR_UPGRADES });
  useEditorCombatSkillStore.getState().importState({ items: [skill('sk_a'), skill('sk_b')] });
  useCharacterProgressionStore.getState().reset();
  useSkillUpgradeStore.getState().reset();
  useHangarUpgradeStore.getState().reset();
  useWalletStore.getState().reset();
  useCharacterStore.getState().reset();
  useCombatTargetStore.getState().reset();
});

describe('character progression', () => {
  it('auto-levels: 250 EXP → spend 100 (lv1) → level 2 with 150 leftover (lv2 needs 200)', () => {
    useCharacterProgressionStore.getState().addExp(CHAR, 250);
    const e = useCharacterProgressionStore.getState().getEntry(CHAR);
    expect(e.level).toBe(2);
    expect(e.exp).toBe(150);
  });
});

describe('skill upgrade economy', () => {
  it('grants 2 points per level; spending follows the curve cost', () => {
    useCharacterProgressionStore.getState().grantLevels(CHAR, 2); // level 3 → (3-1)*2 = 4 points
    expect(availablePoints(CHAR)).toBe(4);
    expect(canUpgrade(CHAR, 'sk_a')).toBe(true);
    expect(tryUpgradeSkill(CHAR, 'sk_a')).toBe(true); // level 1 costs 1
    expect(getSkillLevel('sk_a')).toBe(1);
    expect(availablePoints(CHAR)).toBe(3);
  });

  it('multipliers come from the curve (level 0 = neutral)', () => {
    expect(getSkillMultipliers('sk_a')).toEqual({ damageMult: 1, cooldownMult: 1, energyMult: 1 });
    useSkillUpgradeStore.getState().setLevel('sk_a', 3);
    expect(getSkillMultipliers('sk_a').damageMult).toBe(1.4);
  });

  it('cannot upgrade beyond available points', () => {
    useCharacterProgressionStore.getState().grantLevels(CHAR, 1); // level 2 → 2 points
    useSkillUpgradeStore.getState().setLevel('sk_a', 2); // cumulative cost 2 spent
    expect(availablePoints(CHAR)).toBe(2 - cumulativeCost(2));
    expect(canUpgrade(CHAR, 'sk_b')).toBe(false);
  });
});

describe('hangar upgrades', () => {
  it('purchase is coin-gated and aggregates into bonuses', () => {
    expect(canPurchase('hangar_reinforced_hull')).toBe(false); // no coins
    useWalletStore.getState().addCoins(1000);
    expect(tryPurchase('hangar_reinforced_hull')).toBe(true); // 150 coins, +20 HP
    expect(useWalletStore.getState().coins).toBe(850);
    expect(getHangarBonuses().maxHpBonus).toBe(20);
    tryPurchase('hangar_reinforced_hull');
    expect(getHangarBonuses().maxHpBonus).toBe(40);
  });

  it('sync amplifier raises the fusion charge multiplier above 1', () => {
    useWalletStore.getState().addCoins(1000);
    tryPurchase('hangar_sync_amplifier');
    expect(getHangarBonuses().fusionChargeMult).toBeCloseTo(1.08, 5);
  });
});

describe('kill rewards', () => {
  it('defeating an enemy via applyResult awards EXP to the active character + coins', () => {
    useCharacterStore.getState().selectCharacter(CHAR);
    const t: CombatTarget = { id: 'e1', definitionId: 'd', hp: 5, maxHp: 80, shield: 0, maxShield: 0, x: 0, y: 0, z: 0, defeatedAt: 0, isEnemy: true };
    liveTargets.push(t);
    const result: DamageResult = { targetId: 'e1', shieldDamage: 0, hpDamage: 999, finalAmount: 999, wasWeaknessHit: false, wasCrit: false, targetDefeated: true } as DamageResult;
    useCombatTargetStore.getState().applyResult(result);
    expect(useCharacterProgressionStore.getState().getEntry(CHAR).exp).toBeGreaterThan(0);
    expect(useWalletStore.getState().coins).toBeGreaterThan(0);
  });
});

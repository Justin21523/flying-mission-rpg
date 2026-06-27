import { describe, it, expect, beforeEach } from 'vitest';
import { getHangarBonuses } from './HangarBonusResolver';
import { getEquipmentModMultipliers } from './EquipmentModResolver';
import { useHangarUpgradeDefStore } from '../../stores/game/useHangarUpgradeDefStore';
import { useHangarUpgradeStore } from '../../stores/game/useHangarUpgradeStore';
import { useEquipmentModDefStore } from '../../stores/game/useEquipmentModDefStore';
import { useEquipmentModStore } from '../../stores/game/useEquipmentModStore';
import { SEED_HANGAR_UPGRADES } from '../../data/progression/hangarUpgrades';
import { SEED_EQUIPMENT_MODS } from '../../data/progression/equipmentMods';

beforeEach(() => {
  useHangarUpgradeDefStore.getState().importState({ items: SEED_HANGAR_UPGRADES });
  useHangarUpgradeStore.getState().reset();
  useEquipmentModDefStore.getState().importState({ items: SEED_EQUIPMENT_MODS });
  useEquipmentModStore.getState().reset();
});

describe('Wave 3 Hangar bonuses', () => {
  it('neutral with no purchased levels', () => {
    const b = getHangarBonuses();
    expect(b.cooldownReductionMult).toBe(1);
    expect(b.dropRateMult).toBe(1);
    expect(b.openingShield).toBe(0);
    expect(b.executeRefundMult).toBe(1);
    expect(b.critChanceAdd).toBe(0);
    expect(b.reviveCharges).toBe(0);
  });

  it('aggregates crit chance + revive charges (deferred categories)', () => {
    useHangarUpgradeStore.getState().setLevel('hangar_targeting_optics', 4); // +3%/lvl → 0.12
    useHangarUpgradeStore.getState().setLevel('hangar_emergency_recall', 2); // +1/lvl → 2
    const b = getHangarBonuses();
    expect(b.critChanceAdd).toBeCloseTo(0.12);
    expect(b.reviveCharges).toBe(2);
  });

  it('aggregates the new categories from purchased levels', () => {
    useHangarUpgradeStore.getState().setLevel('hangar_overdrive_cores', 2); // -4%/lvl → 0.92
    useHangarUpgradeStore.getState().setLevel('hangar_salvage_magnet', 3); // +10%/lvl → 1.30
    useHangarUpgradeStore.getState().setLevel('hangar_aegis_plating', 2); // +15/lvl → 30
    useHangarUpgradeStore.getState().setLevel('hangar_executioner_protocol', 1); // +20%/lvl → 1.20
    const b = getHangarBonuses();
    expect(b.cooldownReductionMult).toBeCloseTo(0.92);
    expect(b.dropRateMult).toBeCloseTo(1.3);
    expect(b.openingShield).toBe(30);
    expect(b.executeRefundMult).toBeCloseTo(1.2);
  });

  it('floors cooldown reduction at 0.2', () => {
    useHangarUpgradeStore.getState().setLevel('hangar_overdrive_cores', 5); // -20% → 0.8, still > floor
    expect(getHangarBonuses().cooldownReductionMult).toBeCloseTo(0.8);
  });
});

describe('Wave 3 equipment mods', () => {
  it('neutral when nothing equipped', () => {
    expect(getEquipmentModMultipliers('char_jett')).toEqual({ damageMult: 1, cooldownMult: 1, energyMult: 1 });
  });

  it('aggregates equipped mod values across categories', () => {
    useEquipmentModStore.getState().setEquipped('char_jett', ['mod_power_cell_i', 'mod_coolant_i', 'mod_capacitor_i']);
    const m = getEquipmentModMultipliers('char_jett');
    expect(m.damageMult).toBeCloseTo(1.1);
    expect(m.cooldownMult).toBeCloseTo(0.9);
    expect(m.energyMult).toBeCloseTo(0.9);
  });

  it('caps equipped mods at 3', () => {
    useEquipmentModStore.getState().setEquipped('char_jett', ['mod_power_cell_i', 'mod_power_cell_ii', 'mod_coolant_i', 'mod_capacitor_i']);
    expect(useEquipmentModStore.getState().getEquipped('char_jett').length).toBe(3);
  });

  it('toggleMod equips then unequips and respects the cap', () => {
    const s = useEquipmentModStore.getState();
    s.toggleMod('char_paul', 'mod_power_cell_i');
    expect(useEquipmentModStore.getState().getEquipped('char_paul')).toEqual(['mod_power_cell_i']);
    s.toggleMod('char_paul', 'mod_power_cell_i');
    expect(useEquipmentModStore.getState().getEquipped('char_paul')).toEqual([]);
  });

  it('skips disabled mods', () => {
    useEquipmentModDefStore.getState().update('mod_power_cell_i', { enabled: false });
    useEquipmentModStore.getState().setEquipped('char_jett', ['mod_power_cell_i']);
    expect(getEquipmentModMultipliers('char_jett').damageMult).toBe(1);
  });
});

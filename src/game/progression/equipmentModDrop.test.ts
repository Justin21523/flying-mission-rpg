import { describe, it, expect, beforeEach } from 'vitest';
import { rollModDrop, rollBossModDrop } from './EquipmentModDropResolver';
import { useEquipmentModDefStore, getEquipmentModDef } from '../../stores/game/useEquipmentModDefStore';
import { SEED_EQUIPMENT_MODS } from '../../data/progression/equipmentMods';

beforeEach(() => useEquipmentModDefStore.getState().importState({ items: SEED_EQUIPMENT_MODS }));

describe('Wave 4 equipment-mod drops', () => {
  it('no drop when the chance roll fails', () => {
    expect(rollModDrop(80, 'normal', () => 0.99)).toBeNull();
  });

  it('drops a non-common mod when the chance roll passes', () => {
    const id = rollModDrop(80, 'normal', () => 0);
    expect(id).toBeTruthy();
    expect((getEquipmentModDef(id!)?.rarity ?? 'common')).not.toBe('common');
  });

  it('bosses always attempt a drop and return a real mod', () => {
    const id = rollBossModDrop('normal', () => 0);
    expect(id).toBeTruthy();
    expect(getEquipmentModDef(id!)).toBeTruthy();
  });

  it('higher difficulty raises the per-kill drop chance', () => {
    // rng just below normal chance but the same call passes on hard/ng-plus only when chance is higher.
    // Use a midpoint rng: fails on normal (low chance), passes on ng-plus (higher chance).
    const normalDrop = rollModDrop(80, 'normal', () => 0.09);
    const ngDrop = rollModDrop(80, 'ng-plus', () => 0.09);
    expect(normalDrop).toBeNull();
    expect(ngDrop).toBeTruthy();
  });
});

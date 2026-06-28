import { describe, it, expect, beforeEach } from 'vitest';
import { fuse, canFuse, ownedOfRarity } from './EquipmentModFusionDirector';
import { useEquipmentModInventoryStore } from '../../stores/game/useEquipmentModInventoryStore';
import { useEquipmentModDefStore, getEquipmentModDef } from '../../stores/game/useEquipmentModDefStore';
import { useEquipmentFusionRecipeStore } from '../../stores/game/useEquipmentFusionRecipeStore';
import { useWalletStore } from '../../stores/walletStore';
import { SEED_EQUIPMENT_MODS } from '../../data/progression/equipmentMods';
import { SEED_FUSION_RECIPES } from '../../data/progression/equipmentFusionRecipes';

beforeEach(() => {
  useEquipmentModDefStore.getState().importState({ items: SEED_EQUIPMENT_MODS });
  useEquipmentFusionRecipeStore.getState().importState({ items: SEED_FUSION_RECIPES });
  useEquipmentModInventoryStore.getState().reset(); // owns common ×1 each
  useWalletStore.getState().reset();
});

describe('Wave 5 inventory count map', () => {
  it('addMod increments counts; removeCount fails when short', () => {
    const inv = useEquipmentModInventoryStore.getState();
    inv.addMod('mod_power_cell_ii');
    inv.addMod('mod_power_cell_ii');
    expect(useEquipmentModInventoryStore.getState().count('mod_power_cell_ii')).toBe(2);
    expect(useEquipmentModInventoryStore.getState().removeCount('mod_power_cell_ii', 3)).toBe(false);
    expect(useEquipmentModInventoryStore.getState().removeCount('mod_power_cell_ii', 2)).toBe(true);
    expect(useEquipmentModInventoryStore.getState().count('mod_power_cell_ii')).toBe(0);
  });

  it('importState accepts legacy ownedModIds + keeps default commons', () => {
    useEquipmentModInventoryStore.getState().importState({ ownedModIds: ['mod_overcharge'] });
    const s = useEquipmentModInventoryStore.getState();
    expect(s.has('mod_overcharge')).toBe(true);
    // a default common is still owned
    const aCommon = SEED_EQUIPMENT_MODS.find((m) => (m.rarity ?? 'common') === 'common')!.id;
    expect(s.has(aCommon)).toBe(true);
  });
});

describe('Wave 5 fusion', () => {
  it('refuses without enough input mods (even with coins)', () => {
    useWalletStore.getState().addCoins(500);
    const inv = useEquipmentModInventoryStore.getState();
    // Drain commons below the recipe's inputCount (3).
    for (const id of inv.ownedIds()) { const def = getEquipmentModDef(id); if ((def?.rarity ?? 'common') === 'common') inv.removeCount(id, inv.count(id)); }
    expect(ownedOfRarity('common')).toBe(0);
    expect(canFuse('fuse_common_rare')).toBe(false);
  });

  it('fuses 3 commons + coins into a rare and consumes the inputs', () => {
    // default owns 4 commons ×1 = 4 total; give coins.
    useWalletStore.getState().addCoins(500);
    expect(ownedOfRarity('common')).toBeGreaterThanOrEqual(3);
    expect(canFuse('fuse_common_rare')).toBe(true);
    const before = ownedOfRarity('common');
    const res = fuse('fuse_common_rare', () => 0); // deterministic output pick
    expect(res.ok).toBe(true);
    expect(getEquipmentModDef(res.producedModId!)?.rarity).toBe('rare');
    expect(ownedOfRarity('common')).toBe(before - 3); // consumed 3
    expect(useEquipmentModInventoryStore.getState().has(res.producedModId!)).toBe(true);
    expect(useWalletStore.getState().coins).toBe(500 - 100);
  });

  it('refuses when coins are insufficient (no state change)', () => {
    // owns enough commons but 0 coins
    const before = ownedOfRarity('common');
    const res = fuse('fuse_common_rare', () => 0);
    expect(res.ok).toBe(false);
    expect(ownedOfRarity('common')).toBe(before);
  });
});

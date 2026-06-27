import { getHangarUpgradeDefs, getHangarUpgradeDef } from '../../stores/game/useHangarUpgradeDefStore';
import { useHangarUpgradeStore } from '../../stores/game/useHangarUpgradeStore';
import { useWalletStore } from '../../stores/walletStore';
import type { HangarBonuses } from '../../types/game/hangarUpgrade';

// Batch L — aggregate purchased Hangar levels into global combat bonuses, and gate purchases by coins.

export function getHangarBonuses(): HangarBonuses {
  const levels = useHangarUpgradeStore.getState();
  let maxHpBonus = 0, maxEnergyBonus = 0, fusionAdd = 0;
  let cooldownAdd = 0, dropAdd = 0, openingShield = 0, executeAdd = 0; // Wave 3
  let critAdd = 0, reviveAdd = 0; // Wave 3 (deferred set)
  for (const def of getHangarUpgradeDefs()) {
    const lvl = levels.getLevel(def.id);
    if (lvl <= 0) continue;
    const total = def.perLevel.value * lvl;
    if (def.category === 'maxHp') maxHpBonus += total;
    else if (def.category === 'maxEnergy') maxEnergyBonus += total;
    else if (def.category === 'fusionCharge') fusionAdd += total;
    else if (def.category === 'cooldown') cooldownAdd += total;
    else if (def.category === 'dropRate') dropAdd += total;
    else if (def.category === 'openingShield') openingShield += total;
    else if (def.category === 'executeBonus') executeAdd += total;
    else if (def.category === 'crit') critAdd += total;
    else if (def.category === 'reviveCharge') reviveAdd += total;
  }
  return {
    maxHpBonus, maxEnergyBonus, fusionChargeMult: 1 + fusionAdd,
    cooldownReductionMult: Math.max(0.2, 1 - cooldownAdd), // fractional reduction, floored
    dropRateMult: 1 + dropAdd,
    openingShield,
    executeRefundMult: 1 + executeAdd,
    critChanceAdd: Math.min(1, critAdd), // cap at 100%
    reviveCharges: Math.round(reviveAdd),
  };
}

export function nodeCost(nodeId: string): number | undefined {
  return getHangarUpgradeDef(nodeId)?.perLevel.cost;
}

export function canPurchase(nodeId: string): boolean {
  const def = getHangarUpgradeDef(nodeId);
  if (!def) return false;
  if (useHangarUpgradeStore.getState().getLevel(nodeId) >= def.maxLevel) return false;
  return useWalletStore.getState().coins >= def.perLevel.cost;
}

// Spend coins to buy one level of a node. Returns true if purchased.
export function tryPurchase(nodeId: string): boolean {
  const def = getHangarUpgradeDef(nodeId);
  if (!def || !canPurchase(nodeId)) return false;
  if (!useWalletStore.getState().spend(def.perLevel.cost)) return false;
  useHangarUpgradeStore.getState().setLevel(nodeId, useHangarUpgradeStore.getState().getLevel(nodeId) + 1);
  return true;
}

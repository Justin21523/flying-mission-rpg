// Batch L (meta-progression) — account-wide Hangar upgrades bought with coins. Each node has a category that
// maps to a global combat bonus and a flat per-level cost/value. Definitions are an editor-collection (tunable
// in the 🛠 Hangar tab); the player's purchased levels live in a save-state store. Categories ship wired:
// maxHp / maxEnergy (player CombatStats) and fusionCharge (partner-fusion sync accrual). The tree is
// data-driven so new categories are additive.
export type HangarUpgradeCategory =
  | 'maxHp' | 'maxEnergy' | 'fusionCharge'
  // Wave 3 — new account-wide categories (all wired to real consumption points).
  | 'cooldown' | 'dropRate' | 'openingShield' | 'executeBonus';

export const HANGAR_CATEGORIES: readonly HangarUpgradeCategory[] = [
  'maxHp', 'maxEnergy', 'fusionCharge', 'cooldown', 'dropRate', 'openingShield', 'executeBonus',
];

export interface HangarUpgradeDefinition {
  id: string;
  name: string;
  description?: string;
  category: HangarUpgradeCategory;
  maxLevel: number;
  perLevel: { cost: number; value: number }; // coins per level; bonus value added per level
  editorMeta?: { icon?: string; notes?: string };
}

export interface HangarBonuses {
  maxHpBonus: number; // additive HP
  maxEnergyBonus: number; // additive energy
  fusionChargeMult: number; // multiplier on sync accrual (1 = none)
  // Wave 3 — additional account-wide bonuses.
  cooldownReductionMult: number; // multiplier on skill cooldowns (≤1 = faster; 1 = none)
  dropRateMult: number; // multiplier on coin rewards (1 = none)
  openingShield: number; // flat shield granted on combat entry
  executeRefundMult: number; // multiplier on execution-finisher resource refund (1 = none)
}

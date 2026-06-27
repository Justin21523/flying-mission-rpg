// Batch O — editable rules mapping a skill's damageType / attack tags → an applied status effect (player→enemy).
// Auto-covers the whole arsenal without retagging 128 abilities. Edited in the ⬆ Progression tab.
export type StatusEffectId = 'burning' | 'frozen' | 'shocked' | 'armor-broken';

export interface StatusRuleDefinition {
  id: string;
  effect: StatusEffectId;
  damageTypes: string[]; // any of these damageTypes triggers it
  tags: string[]; // any of these attackTags triggers it
  enabled?: boolean;
}

export const SEED_STATUS_RULES: StatusRuleDefinition[] = [
  { id: 'rule_burn', effect: 'burning', damageTypes: ['fire'], tags: ['fire', 'burn', 'flame'], enabled: true },
  { id: 'rule_freeze', effect: 'frozen', damageTypes: ['ice', 'frost'], tags: ['ice', 'frost', 'freeze'], enabled: true },
  { id: 'rule_shock', effect: 'shocked', damageTypes: ['electric'], tags: ['shock', 'electric', 'lightning'], enabled: true },
  { id: 'rule_armor', effect: 'armor-broken', damageTypes: [], tags: ['heavy-impact', 'shield-break', 'armor-break'], enabled: true },
];

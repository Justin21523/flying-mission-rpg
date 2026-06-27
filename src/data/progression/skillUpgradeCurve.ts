import type { SkillUpgradeLevelDefinition } from '../../types/game/skillUpgrade';

// Batch L — the shared 5-level skill upgrade curve. Tunable in the ⬆ Upgrades editor tab. Cumulative cost to
// max a skill = 1+1+2+2+3 = 9 points. Damage roughly +85% at max, with modest cooldown/energy improvements.
export const SEED_SKILL_UPGRADE_CURVE: SkillUpgradeLevelDefinition[] = [
  { id: 'sklvl_1', level: 1, damageMult: 1.12, cooldownMult: 0.96, energyMult: 0.97, costPoints: 1 },
  { id: 'sklvl_2', level: 2, damageMult: 1.25, cooldownMult: 0.92, energyMult: 0.94, costPoints: 1 },
  { id: 'sklvl_3', level: 3, damageMult: 1.4, cooldownMult: 0.88, energyMult: 0.9, costPoints: 2 },
  { id: 'sklvl_4', level: 4, damageMult: 1.6, cooldownMult: 0.84, energyMult: 0.86, costPoints: 2 },
  { id: 'sklvl_5', level: 5, damageMult: 1.85, cooldownMult: 0.8, energyMult: 0.82, costPoints: 3 },
];

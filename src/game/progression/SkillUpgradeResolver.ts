import { getUpgradeCurve, getMaxSkillLevel } from '../../stores/game/useSkillUpgradeCurveStore';
import { useSkillUpgradeStore } from '../../stores/game/useSkillUpgradeStore';
import { useCharacterProgressionStore } from '../../stores/game/useCharacterProgressionStore';
import { getSkillsForCharacter } from '../../stores/game/editorCombatStore';
import { SKILL_POINTS_PER_LEVEL } from '../../types/game/skillUpgrade';

// Batch L — pure-ish resolver for the per-skill upgrade economy. Reused by the cast path (multipliers), the
// Upgrades UI (cost / affordability), and tests. Level 0 = base (all multipliers 1.0).

export interface SkillMultipliers { damageMult: number; cooldownMult: number; energyMult: number }
const NEUTRAL: SkillMultipliers = { damageMult: 1, cooldownMult: 1, energyMult: 1 };

export function getSkillLevel(skillId: string): number {
  return useSkillUpgradeStore.getState().getLevel(skillId);
}

export function getSkillMultipliers(skillId: string): SkillMultipliers {
  const level = getSkillLevel(skillId);
  if (level <= 0) return NEUTRAL;
  const def = getUpgradeCurve().find((c) => c.level === level);
  return def ? { damageMult: def.damageMult, cooldownMult: def.cooldownMult, energyMult: def.energyMult } : NEUTRAL;
}

// Total skill points to REACH a given level (sum of costs for levels 1..level).
export function cumulativeCost(level: number): number {
  return getUpgradeCurve().filter((c) => c.level <= level).reduce((s, c) => s + c.costPoints, 0);
}

export function nextLevelCost(skillId: string): number | undefined {
  const next = getSkillLevel(skillId) + 1;
  return getUpgradeCurve().find((c) => c.level === next)?.costPoints;
}

// Skill points the character has SPENT across all of its player-faction skills.
export function spentForCharacter(characterId: string): number {
  return getSkillsForCharacter(characterId).reduce((s, skill) => s + cumulativeCost(getSkillLevel(skill.id)), 0);
}

// Skill points the character has EARNED (level 1 grants none; each level-up grants SKILL_POINTS_PER_LEVEL).
export function earnedPoints(characterId: string): number {
  const lvl = useCharacterProgressionStore.getState().getEntry(characterId).level;
  return Math.max(0, (lvl - 1) * SKILL_POINTS_PER_LEVEL);
}

export function availablePoints(characterId: string): number {
  return Math.max(0, earnedPoints(characterId) - spentForCharacter(characterId));
}

export function canUpgrade(characterId: string, skillId: string): boolean {
  const cost = nextLevelCost(skillId);
  if (cost == null) return false; // already max
  if (getSkillLevel(skillId) >= getMaxSkillLevel()) return false;
  return availablePoints(characterId) >= cost;
}

// Spend points to raise a skill one level. Returns true if applied.
export function tryUpgradeSkill(characterId: string, skillId: string): boolean {
  if (!canUpgrade(characterId, skillId)) return false;
  useSkillUpgradeStore.getState().setLevel(skillId, getSkillLevel(skillId) + 1);
  return true;
}

import type { EnemyEncounterDefinition } from '../../types/encounterTypes';

export function resolveEncounterScaling(encounter: EnemyEncounterDefinition, difficultyRating = 1) {
  const scaling = encounter.scaling;
  if (!scaling?.enabled) return { hpMultiplier: 1, damageMultiplier: 1, countMultiplier: 1 };
  const difficultyBonus = scaling.basedOnStageDifficulty ? Math.max(0, difficultyRating - 1) * 0.08 : 0;
  return {
    hpMultiplier: (scaling.hpMultiplier ?? 1) + difficultyBonus,
    damageMultiplier: (scaling.damageMultiplier ?? 1) + difficultyBonus,
    countMultiplier: scaling.countMultiplier ?? 1,
  };
}

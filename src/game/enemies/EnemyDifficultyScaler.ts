import type { EnemyDefinition } from '../../types/game/combat';

export function scaleEnemyDefinition(enemy: EnemyDefinition, difficultyRating: number): EnemyDefinition {
  const factor = 1 + Math.max(0, difficultyRating - 1) * 0.12;
  return {
    ...enemy,
    maxHp: Math.round(enemy.maxHp * factor),
    maxShield: enemy.maxShield == null ? undefined : Math.round(enemy.maxShield * factor),
  };
}

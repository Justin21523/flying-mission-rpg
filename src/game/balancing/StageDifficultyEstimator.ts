import type { StageDefinition } from '../../types/stageTypes';
import { countStageEnemies } from './EncounterBudgetAnalyzer';

export function estimateStageDifficulty(stage: StageDefinition): 1 | 2 | 3 | 4 | 5 {
  const enemies = countStageEnemies(stage);
  const base = stage.editorMeta?.difficultyRating ?? 1;
  const boss = stage.requiredSystems.boss ? 1 : 0;
  const pressure = enemies.elites > 0 || enemies.turrets >= 3 ? 1 : 0;
  return Math.min(5, Math.max(1, base + boss + pressure - 1)) as 1 | 2 | 3 | 4 | 5;
}

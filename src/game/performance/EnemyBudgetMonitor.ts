import { liveTargets } from '../../stores/game/combatTargetStore';
import { DEFAULT_DEMO_PERFORMANCE_BUDGET, type PerformanceBudget } from './PerformanceBudget';

export function getActiveEnemyCount(): number {
  return liveTargets.filter((target) => target.isEnemy && !target.defeatedAt).length;
}

export function getEnemyBudgetWarnings(budget: PerformanceBudget = DEFAULT_DEMO_PERFORMANCE_BUDGET): string[] {
  const count = getActiveEnemyCount();
  return count > budget.maxActiveEnemies ? [`Enemies ${count}/${budget.maxActiveEnemies}`] : [];
}

import { liveSpawns } from '../../stores/game/combatSpawnStore';
import { performanceMonitor } from './PerformanceMonitor';
import { getRuntimeStats } from './RuntimeStatsCollector';
import { getActiveEnemyCount, getEnemyBudgetWarnings } from './EnemyBudgetMonitor';
import { getVfxBudgetSnapshot } from './VfxBudgetMonitor';
import { validateSceneCleanup } from './SceneCleanupValidator';
import { DEFAULT_DEMO_PERFORMANCE_BUDGET, type PerformanceBudget } from './PerformanceBudget';

export function getRuntimePerformanceSnapshot(budget: PerformanceBudget = DEFAULT_DEMO_PERFORMANCE_BUDGET) {
  const stats = getRuntimeStats();
  const vfx = getVfxBudgetSnapshot(budget);
  const cleanup = validateSceneCleanup();
  const activeProjectiles = liveSpawns.filter((spawn) => spawn.kind === 'projectile' && !spawn.hasImpacted).length;
  const warnings = [
    ...getEnemyBudgetWarnings(budget),
    ...vfx.warnings,
    ...(activeProjectiles > budget.maxActiveProjectiles ? [`Projectiles ${activeProjectiles}/${budget.maxActiveProjectiles}`] : []),
  ];
  return {
    fps: Math.round(performanceMonitor.fps),
    activeEnemies: getActiveEnemyCount(),
    activeProjectiles,
    activeVfx: vfx.activeVfxInstances,
    activePhysicsObjects: vfx.activePhysicsVfxObjects,
    activeParticles: stats.particles,
    activeIncidents: 0,
    activeBossAttacks: 0,
    cleanupWarnings: cleanup.warnings,
    warnings,
  };
}

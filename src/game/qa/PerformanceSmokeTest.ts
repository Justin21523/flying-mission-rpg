import type { QACheck } from './ReleaseCandidateChecklist';
import { makeSmokeCheck } from './SmokeTestRunner';
import { validateSceneCleanup } from '../performance/SceneCleanupValidator';
import { DEFAULT_DEMO_PERFORMANCE_BUDGET } from '../performance/PerformanceBudget';

export function runPerformanceSmokeTest(): QACheck[] {
  const cleanup = validateSceneCleanup();
  return [
    makeSmokeCheck('perf_vfx_under_budget', 'Active VFX under budget', 'performance', cleanup.activeVfxInstances <= DEFAULT_DEMO_PERFORMANCE_BUDGET.maxActiveVfxInstances, `Active VFX ${cleanup.activeVfxInstances}`),
    makeSmokeCheck('perf_physics_under_budget', 'Active physics VFX under budget', 'performance', cleanup.activePhysicsVfxObjects <= DEFAULT_DEMO_PERFORMANCE_BUDGET.maxActivePhysicsVfxObjects, `Active physics VFX ${cleanup.activePhysicsVfxObjects}`),
    makeSmokeCheck('perf_projectiles_under_budget', 'Active projectiles under budget', 'performance', cleanup.activeProjectiles <= DEFAULT_DEMO_PERFORMANCE_BUDGET.maxActiveProjectiles, `Active projectiles ${cleanup.activeProjectiles}`),
  ];
}

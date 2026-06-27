import type { QAFinding } from './ReleaseCandidateChecklist';
import { validateSceneCleanup } from '../performance/SceneCleanupValidator';
import { DEFAULT_DEMO_PERFORMANCE_BUDGET } from '../performance/PerformanceBudget';

export function validateSceneLifecycle(): QAFinding[] {
  const cleanup = validateSceneCleanup();
  const findings: QAFinding[] = [];
  if (cleanup.activeVfxInstances > DEFAULT_DEMO_PERFORMANCE_BUDGET.maxActiveVfxInstances) {
    findings.push({ id: 'active_vfx_over_budget', severity: 'error', system: 'scene-lifecycle', message: `Active VFX over budget: ${cleanup.activeVfxInstances}` });
  }
  if (cleanup.activePhysicsVfxObjects > DEFAULT_DEMO_PERFORMANCE_BUDGET.maxActivePhysicsVfxObjects) {
    findings.push({ id: 'active_physics_vfx_over_budget', severity: 'error', system: 'scene-lifecycle', message: `Active physics VFX over budget: ${cleanup.activePhysicsVfxObjects}` });
  }
  if (cleanup.activeProjectiles > DEFAULT_DEMO_PERFORMANCE_BUDGET.maxActiveProjectiles) {
    findings.push({ id: 'active_projectiles_over_budget', severity: 'error', system: 'scene-lifecycle', message: `Active projectiles over budget: ${cleanup.activeProjectiles}` });
  }
  if (cleanup.activeEnemies > DEFAULT_DEMO_PERFORMANCE_BUDGET.maxActiveEnemies) {
    findings.push({ id: 'active_enemies_over_budget', severity: 'error', system: 'scene-lifecycle', message: `Active enemies over budget: ${cleanup.activeEnemies}` });
  }
  return findings;
}

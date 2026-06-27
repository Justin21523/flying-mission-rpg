import { activeCount as activeCinematicVfx } from '../vfx/CinematicEffectPool';
import { activeCount as activePhysicsVfx } from '../vfx/physics/PhysicsVfxObjectPool';
import { getRuntimeStats } from './RuntimeStatsCollector';
import { DEFAULT_DEMO_PERFORMANCE_BUDGET, type PerformanceBudget } from './PerformanceBudget';

export type VfxBudgetSnapshot = {
  activeVfxInstances: number;
  activePhysicsVfxObjects: number;
  activeParticles: number;
  warnings: string[];
};

export function getVfxBudgetSnapshot(budget: PerformanceBudget = DEFAULT_DEMO_PERFORMANCE_BUDGET): VfxBudgetSnapshot {
  const stats = getRuntimeStats();
  const activeVfxInstances = activeCinematicVfx();
  const activePhysicsVfxObjects = activePhysicsVfx();
  const activeParticles = stats.particles;
  const warnings: string[] = [];
  if (activeVfxInstances > budget.maxActiveVfxInstances) warnings.push(`VFX instances ${activeVfxInstances}/${budget.maxActiveVfxInstances}`);
  if (activePhysicsVfxObjects > budget.maxActivePhysicsVfxObjects) warnings.push(`Physics VFX ${activePhysicsVfxObjects}/${budget.maxActivePhysicsVfxObjects}`);
  if (activeParticles > budget.maxActiveParticles) warnings.push(`Particles ${activeParticles}/${budget.maxActiveParticles}`);
  return { activeVfxInstances, activePhysicsVfxObjects, activeParticles, warnings };
}

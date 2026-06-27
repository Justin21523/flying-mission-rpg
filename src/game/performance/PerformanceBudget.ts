export type PerformanceBudget = {
  maxActiveEnemies: number;
  maxActiveProjectiles: number;
  maxActiveParticles: number;
  maxActivePhysicsVfxObjects: number;
  maxActiveVfxInstances: number;
  maxDrawCallWarning?: number;
  targetFps: 60 | 30;
};

export const DEFAULT_DEMO_PERFORMANCE_BUDGET: PerformanceBudget = {
  maxActiveEnemies: 8,
  maxActiveProjectiles: 40,
  maxActiveParticles: 1200,
  maxActivePhysicsVfxObjects: 120,
  maxActiveVfxInstances: 48,
  maxDrawCallWarning: 900,
  targetFps: 60,
};

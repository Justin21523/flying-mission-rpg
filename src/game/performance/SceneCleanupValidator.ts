import { liveSpawns } from '../../stores/game/combatSpawnStore';
import { liveTargets } from '../../stores/game/combatTargetStore';
import { activeCount as activeCinematicVfx } from '../vfx/CinematicEffectPool';
import { activeCount as activePhysicsVfx } from '../vfx/physics/PhysicsVfxObjectPool';

export type SceneCleanupReport = {
  ok: boolean;
  warnings: string[];
  activeEnemies: number;
  activeProjectiles: number;
  activeVfxInstances: number;
  activePhysicsVfxObjects: number;
};

export function validateSceneCleanup(): SceneCleanupReport {
  const activeEnemies = liveTargets.filter((target) => target.isEnemy && !target.defeatedAt).length;
  const activeProjectiles = liveSpawns.filter((spawn) => spawn.kind === 'projectile' && !spawn.hasImpacted).length;
  const activeVfxInstances = activeCinematicVfx();
  const activePhysicsVfxObjects = activePhysicsVfx();
  const warnings: string[] = [];
  if (activeEnemies > 0) warnings.push(`Active enemies remain: ${activeEnemies}`);
  if (activeProjectiles > 0) warnings.push(`Active projectiles remain: ${activeProjectiles}`);
  if (activeVfxInstances > 0) warnings.push(`Active VFX instances remain: ${activeVfxInstances}`);
  if (activePhysicsVfxObjects > 0) warnings.push(`Active physics VFX objects remain: ${activePhysicsVfxObjects}`);
  return { ok: warnings.length === 0, warnings, activeEnemies, activeProjectiles, activeVfxInstances, activePhysicsVfxObjects };
}

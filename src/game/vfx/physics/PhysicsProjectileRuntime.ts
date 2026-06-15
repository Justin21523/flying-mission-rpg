import type { PhysicsVfxObjectDefinition } from '../../../types/physicsVfxTypes';

// Thrown physics projectile (Batch F.6) — e.g. Donnie magnetic scrap clump or a hologram data fragment.
export function makeProjectile(id: string, color: string, objectType: PhysicsVfxObjectDefinition['objectType'] = 'energy-fragment', count = 5): PhysicsVfxObjectDefinition {
  return {
    id, objectType, shape: 'box', color,
    physics: { mode: 'kinematic', gravityScale: 0.5, restitution: 0.2, friction: 0.3, lifetimeSeconds: 1.2, collisionEnabled: false, damageOnImpact: true, behavior: 'debris' },
    spawn: { count, spreadShape: 'line', initialSpeedRange: [12, 16], angularSpeedRange: [-8, 8], sizeRange: [0.2, 0.4] },
    cleanup: { fadeOutSeconds: 0.25, returnToPool: true },
  };
}

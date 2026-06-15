import type { PhysicsVfxObjectDefinition } from '../../../types/physicsVfxTypes';

// Bouncy sport balls (Batch F.6) — Flip's signature. High restitution so they ricochet off the ground.
export function makeBall(id: string, color: string, count = 1): PhysicsVfxObjectDefinition {
  return {
    id, objectType: 'sport-ball', shape: 'sphere', color,
    physics: { mode: 'kinematic', gravityScale: 0.7, restitution: 0.85, friction: 0.1, lifetimeSeconds: 2.5, collisionEnabled: true, damageOnImpact: true, behavior: 'bounce' },
    spawn: { count, spreadShape: count > 1 ? 'cone' : 'line', initialSpeedRange: [10, 14], angularSpeedRange: [-4, 4], sizeRange: [0.4, 0.5] },
    cleanup: { fadeOutSeconds: 0.3, returnToPool: true },
  };
}

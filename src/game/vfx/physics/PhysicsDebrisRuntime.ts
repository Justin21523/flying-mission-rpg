import type { PhysicsVfxObjectDefinition } from '../../../types/physicsVfxTypes';

// Debris / fragment objects (Batch F.6) — small scattering chunks (Jett dust, Todd dirt, generic impact).
export function makeDebris(id: string, color: string, count = 12): PhysicsVfxObjectDefinition {
  return {
    id, objectType: 'debris', shape: 'box', color,
    physics: { mode: 'kinematic', gravityScale: 1, restitution: 0.25, friction: 0.5, lifetimeSeconds: 1.1, collisionEnabled: false, behavior: 'scatter' },
    spawn: { count, spreadShape: 'cone', initialSpeedRange: [4, 9], angularSpeedRange: [-6, 6], sizeRange: [0.12, 0.28] },
    cleanup: { fadeOutSeconds: 0.35, returnToPool: true },
  };
}

export function makeEnergyFragments(id: string, color: string, count = 8): PhysicsVfxObjectDefinition {
  return {
    id, objectType: 'energy-fragment', shape: 'box', color,
    physics: { mode: 'visual-only', gravityScale: 0, lifetimeSeconds: 1.0, collisionEnabled: false, behavior: 'orbit' },
    spawn: { count, spreadShape: 'ring', initialSpeedRange: [0, 0], sizeRange: [0.18, 0.3], spreadRadius: 1.6 },
    cleanup: { fadeOutSeconds: 0.3, returnToPool: true },
  };
}

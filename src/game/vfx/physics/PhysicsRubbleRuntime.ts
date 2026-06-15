import type { PhysicsVfxObjectDefinition } from '../../../types/physicsVfxTypes';

// Rubble / rock chunks (Batch F.6) — Todd's signature ground fracture: heavy chunks erupt + tumble.
export function makeRubble(id: string, color: string, count = 14): PhysicsVfxObjectDefinition {
  return {
    id, objectType: 'rubble', shape: 'box', color,
    physics: { mode: 'kinematic', gravityScale: 1.2, restitution: 0.2, friction: 0.6, lifetimeSeconds: 1.6, collisionEnabled: false, behavior: 'ground-fracture' },
    spawn: { count, spreadShape: 'cone', initialSpeedRange: [6, 12], angularSpeedRange: [-7, 7], sizeRange: [0.25, 0.6] },
    cleanup: { fadeOutSeconds: 0.4, returnToPool: true },
  };
}

export function makeDrillFragments(id: string, color: string, count = 10): PhysicsVfxObjectDefinition {
  return {
    id, objectType: 'drill-fragment', shape: 'cylinder', color,
    physics: { mode: 'kinematic', gravityScale: 1, restitution: 0.25, friction: 0.5, lifetimeSeconds: 1.3, collisionEnabled: false, behavior: 'scatter' },
    spawn: { count, spreadShape: 'cone', initialSpeedRange: [7, 13], angularSpeedRange: [-9, 9], sizeRange: [0.18, 0.4] },
    cleanup: { fadeOutSeconds: 0.35, returnToPool: true },
  };
}

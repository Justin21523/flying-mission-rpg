import type { PhysicsVfxObjectDefinition } from '../../../types/physicsVfxTypes';

// Panel objects (Batch F.6) — Donnie metal cover panels that assemble into a wall, Paul shield tiles / road
// barriers. 'assemble' eases them into formation; 'shield-panels' arranges a rotating arc.
export function makeAssemblyPanels(id: string, color: string, count = 6): PhysicsVfxObjectDefinition {
  return {
    id, objectType: 'metal-panel', shape: 'box', color,
    physics: { mode: 'kinematic', gravityScale: 0, lifetimeSeconds: 4, collisionEnabled: true, behavior: 'assemble' },
    spawn: { count, spreadShape: 'ring', initialSpeedRange: [0, 0], sizeRange: [0.8, 1.1], spreadRadius: 3 },
    cleanup: { fadeOutSeconds: 0.5, returnToPool: true },
  };
}

export function makeShieldTiles(id: string, color: string, count = 8): PhysicsVfxObjectDefinition {
  return {
    id, objectType: 'shield-tile', shape: 'box', color,
    physics: { mode: 'visual-only', gravityScale: 0, lifetimeSeconds: 4, collisionEnabled: false, behavior: 'shield-panels' },
    spawn: { count, spreadShape: 'ring', initialSpeedRange: [0, 0], sizeRange: [0.5, 0.7], spreadRadius: 2.2 },
    cleanup: { fadeOutSeconds: 0.5, returnToPool: true },
  };
}

export function makeBarrierWall(id: string, color: string, count = 5): PhysicsVfxObjectDefinition {
  return {
    id, objectType: 'metal-panel', shape: 'box', color,
    physics: { mode: 'kinematic', gravityScale: 0, lifetimeSeconds: 5, collisionEnabled: true, behavior: 'assemble' },
    spawn: { count, spreadShape: 'line', initialSpeedRange: [3, 5], sizeRange: [1.0, 1.4], spreadRadius: 2 },
    cleanup: { fadeOutSeconds: 0.5, returnToPool: true },
  };
}

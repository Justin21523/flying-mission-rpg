// Physics object VFX (Batch F.6) — lightweight KINEMATIC temporary objects (debris / panels / balls / rubble
// / decoys) used by signature ability effects. Not rapier rigid bodies — pooled analytic objects integrated
// each frame (pos/vel/gravity/bounce/lifetime) and rendered as instanced/geometry meshes in the combat layer.
// Gameplay (damage / blocker) routes through the existing combatSpawnStore; these are the VISUAL layer.

export type PhysicsVfxObjectType =
  | 'debris'
  | 'metal-panel'
  | 'repair-tool'
  | 'sport-ball'
  | 'rubble'
  | 'shield-tile'
  | 'energy-fragment'
  | 'animal-spirit-placeholder'
  | 'hologram-decoy'
  | 'drill-fragment';

export const PHYSICS_VFX_OBJECT_TYPES: readonly PhysicsVfxObjectType[] = [
  'debris', 'metal-panel', 'repair-tool', 'sport-ball', 'rubble', 'shield-tile',
  'energy-fragment', 'animal-spirit-placeholder', 'hologram-decoy', 'drill-fragment',
];

export type PhysicsVfxShape = 'box' | 'sphere' | 'capsule' | 'cylinder' | 'custom-placeholder';

export type PhysicsVfxMode = 'rigid-body' | 'kinematic' | 'visual-only';

export type PhysicsVfxSpreadShape = 'point' | 'cone' | 'sphere' | 'line' | 'ring' | 'box';

// How the spawned objects move (the kinematic integrator branches on this).
export type PhysicsVfxCollisionBehavior =
  | 'none' | 'debris' | 'bounce' | 'assemble' | 'orbit' | 'scatter' | 'shield-panels' | 'ground-fracture';

export interface PhysicsVfxObjectDefinition {
  id: string;
  objectType: PhysicsVfxObjectType;
  shape: PhysicsVfxShape;
  modelPresetId?: string;
  color?: string;

  physics: {
    mode: PhysicsVfxMode;
    mass?: number;
    gravityScale?: number;
    restitution?: number; // bounce 0..1
    friction?: number;
    linearDamping?: number;
    angularDamping?: number;
    lifetimeSeconds: number;
    collisionEnabled: boolean;
    damageOnImpact?: boolean;
    behavior?: PhysicsVfxCollisionBehavior;
  };

  spawn: {
    count: number;
    spreadShape: PhysicsVfxSpreadShape;
    initialSpeedRange: [number, number];
    angularSpeedRange?: [number, number];
    sizeRange?: [number, number];
    spreadRadius?: number;
  };

  cleanup: {
    fadeOutSeconds: number;
    returnToPool: boolean;
    destroyOnSleep?: boolean;
  };
}

export interface PhysicsVfxValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

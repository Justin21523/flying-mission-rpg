import type { PhysicsVfxObjectDefinition, PhysicsVfxValidationResult } from '../../../types/physicsVfxTypes';
import { PHYSICS_VFX_OBJECT_TYPES } from '../../../types/physicsVfxTypes';

const PHYSICS_VFX_OBJECT_HARD_CAP = 40; // per single spawn def

// Pure validator for a physics VFX object definition (Batch F.6).
export function validatePhysicsVfxObject(def: PhysicsVfxObjectDefinition): PhysicsVfxValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!def.id?.trim()) errors.push('physics object id must not be empty.');
  if (!PHYSICS_VFX_OBJECT_TYPES.includes(def.objectType)) errors.push(`unknown objectType "${def.objectType}".`);
  if (def.physics.lifetimeSeconds <= 0) errors.push('lifetimeSeconds must be > 0.');
  if (def.physics.restitution != null && (def.physics.restitution < 0 || def.physics.restitution > 1)) errors.push('restitution must be 0..1.');
  if (def.spawn.count <= 0) errors.push('spawn.count must be > 0.');
  if (def.spawn.count > PHYSICS_VFX_OBJECT_HARD_CAP) warnings.push(`spawn.count ${def.spawn.count} exceeds ${PHYSICS_VFX_OBJECT_HARD_CAP} (perf).`);
  if (def.spawn.initialSpeedRange[0] > def.spawn.initialSpeedRange[1]) errors.push('initialSpeedRange min > max.');
  if (def.cleanup.fadeOutSeconds < 0) errors.push('cleanup.fadeOutSeconds must be >= 0.');
  return { ok: errors.length === 0, errors, warnings };
}

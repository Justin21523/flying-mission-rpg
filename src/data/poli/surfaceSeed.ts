import type { SurfaceDefinition } from '../../types/surface';

// Phase D — a starter set of surface definitions (authoring data for the 🛣 Tracks → Surfaces editor). Runtime
// application of these multipliers to movement is a later task; these exist so they can be authored/exported now.
function surface(id: string, name: string, p: Partial<SurfaceDefinition> & Pick<SurfaceDefinition, 'surfaceType'>): SurfaceDefinition {
  return {
    id, name,
    friction: 1, accelerationMultiplier: 1, maxSpeedMultiplier: 1, steeringMultiplier: 1, brakingMultiplier: 1,
    pathAssistStrength: 0, enterPathFollow: false, tags: [],
    ...p,
  };
}

export const SURFACE_SEED: SurfaceDefinition[] = [
  surface('surf_asphalt', 'Asphalt', { surfaceType: 'asphalt', friction: 1, accelerationMultiplier: 1, maxSpeedMultiplier: 1, tags: ['road'] }),
  surface('surf_grass', 'Grass', { surfaceType: 'grass', friction: 0.85, accelerationMultiplier: 0.85, maxSpeedMultiplier: 0.9, tags: ['offroad'] }),
  surface('surf_ice', 'Ice', { surfaceType: 'ice', friction: 0.2, accelerationMultiplier: 0.6, steeringMultiplier: 0.4, brakingMultiplier: 0.3, tags: ['slippery'] }),
  surface('surf_mud', 'Mud', { surfaceType: 'mud', friction: 1.4, accelerationMultiplier: 0.5, maxSpeedMultiplier: 0.6, tags: ['offroad', 'slow'] }),
  surface('surf_boost', 'Boost Surface', { surfaceType: 'boostSurface', maxSpeedMultiplier: 1.6, accelerationMultiplier: 1.4, tags: ['boost'] }),
  surface('surf_guided', 'Guided Road', { surfaceType: 'guidedRoad', pathAssistStrength: 1, enterPathFollow: true, tags: ['guided'] }),
];

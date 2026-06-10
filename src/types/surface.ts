// Phase A (data model) — per-surface movement/feel definitions. A follower (player/NPC/vehicle) standing on a
// surface applies these multipliers (speed/friction/steering/braking) + optional path assist, sounds, particles
// and animation hooks. Detection + application land in Phase B/C. Additive to the existing ground/biome system.
export type SurfaceType =
  | 'asphalt'
  | 'sidewalk'
  | 'grass'
  | 'dirt'
  | 'mud'
  | 'sand'
  | 'gravel'
  | 'wood'
  | 'metal'
  | 'water'
  | 'ice'
  | 'boostSurface'
  | 'guidedRoad'
  | 'custom';

export const SURFACE_TYPES: SurfaceType[] = [
  'asphalt', 'sidewalk', 'grass', 'dirt', 'mud', 'sand', 'gravel', 'wood', 'metal',
  'water', 'ice', 'boostSurface', 'guidedRoad', 'custom',
];

export interface SurfaceDefinition {
  id: string;
  name: string;
  surfaceType: SurfaceType;
  friction: number;
  accelerationMultiplier: number;
  maxSpeedMultiplier: number;
  steeringMultiplier: number;
  brakingMultiplier: number;
  pathAssistStrength: number;     // 0 = none; >0 nudges followers toward linkedPath
  enterPathFollow: boolean;
  linkedPathId?: string;
  footstepSoundId?: string;
  drivingSoundId?: string;
  particleEffectId?: string;
  enterAnimationId?: string;
  moveAnimationId?: string;
  exitAnimationId?: string;
  tags: string[];
}

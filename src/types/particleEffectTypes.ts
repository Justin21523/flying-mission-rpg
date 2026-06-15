// Cinematic VFX — particle layer settings (Batch F.5). Authoring-friendly settings that the
// CinematicVfxDirector translates into the unified V2 ParticleEffectParameters (reusing the pooled
// transformation ParticleRenderer / THREE.Points engine). No new particle engine — these just describe shape.

export type ParticleSpawnShape = 'point' | 'sphere' | 'cone' | 'ring' | 'box' | 'line';
export const PARTICLE_SPAWN_SHAPES: readonly ParticleSpawnShape[] = ['point', 'sphere', 'cone', 'ring', 'box', 'line'];

export type ParticleBlendMode = 'normal' | 'additive' | 'soft';

export interface ParticleLayerSettings {
  count: number;
  spawnShape: ParticleSpawnShape;
  speedRange: [number, number];
  sizeRange: [number, number];
  lifetimeRange: [number, number];
  gravity?: [number, number, number];
  spreadAngleDegrees?: number;
  colorStart?: string;
  colorEnd?: string;
  opacityStart?: number;
  opacityEnd?: number;
  blendMode?: ParticleBlendMode;
  billboard?: boolean;
}

// Soft cap so a single layer can't flood the pool; the director clamps + the validator warns past this.
export const PARTICLE_LAYER_MAX_COUNT = 600;

import { registerEffect, getEffectEntry, type EffectEditorField, type EffectRegistryEntry } from './registry';
import { CloneBurstRenderer } from './renderers/CloneBurstRenderer';
import { ParticleRenderer } from './renderers/ParticleRenderer';
import { LightSpaceRenderer } from './renderers/LightSpaceRenderer';
import { PhysicsRenderer, CameraEffectRenderer } from './renderers/miscRenderers';
import { ModelParticleRenderer } from './renderers/ModelParticleRenderer';
import { NullRenderer } from './renderers/NullRenderer';
import { defaultCloneParameters } from './cloneSampling';
import { EFFECT_TYPES_V2, V1_EFFECT_TYPES, isCloneEffectType, isModelParticleType, type EffectCategory, type EffectParameters, type EffectTypeV2 } from '../../../types/game/transformationEffects';

// v1 legacy types render via the bespoke EffectViz (fed from snapshot.activeEffects); the registry entry holds
// only their editor metadata, with NullRenderer (never mounted by the v2 host).
const V1_FIELDS: EffectEditorField[] = [
  { key: 'scale', label: 'Scale', kind: 'number', step: 0.5 },
  { key: 'repeat', label: 'Count', kind: 'number', step: 2 },
  { key: 'particleCount', label: 'Particles', kind: 'number', step: 10 },
  { key: 'ringCount', label: 'Rings', kind: 'number', step: 1 },
  { key: 'ghostSpread', label: 'Spread', kind: 'number', step: 1 },
];
const MODEL_PARTICLE_FIELDS: EffectEditorField[] = [
  { key: 'particleModelId', label: 'Model id (blank = character)', kind: 'text' },
  { key: 'particleCount', label: 'Count', kind: 'number', step: 1, min: 1, max: 30 },
  { key: 'particleModelScale', label: 'Model scale', kind: 'number', step: 0.05, min: 0.01 },
  { key: 'particleModelSpin', label: 'Spin', kind: 'number', step: 0.25 },
  { key: 'particleSpeed', label: 'Speed', kind: 'number', step: 0.5 },
  { key: 'particleSpreadRadius', label: 'Spread radius', kind: 'number', step: 0.5 },
  { key: 'particleOrbitRadius', label: 'Orbit radius', kind: 'number', step: 0.5 },
  { key: 'particleOrbitSpeed', label: 'Orbit speed', kind: 'number', step: 0.25 },
  { key: 'particleLifetime', label: 'Lifetime (s)', kind: 'number', step: 0.1, min: 0.1 },
  { key: 'particleGravity', label: 'Gravity', kind: 'number', step: 0.5 },
];
const v1CategoryOf = (t: EffectTypeV2): EffectCategory => (t === 'energy-ring' || t === 'glow-pulse' || t === 'white-flash' || t === 'outline' ? 'light' : 'particle');

// Register EVERY effect-type name → a category renderer with default params + editor fields. New types are one
// line here; the editor + host read the registry, so there is no switch/if-else sprawl.

const num = (key: keyof EffectParameters, label: string, step = 1, min?: number, max?: number): EffectEditorField => ({ key, label, kind: 'number', step, min, max });
const bool = (key: keyof EffectParameters, label: string): EffectEditorField => ({ key, label, kind: 'bool' });
const color = (key: keyof EffectParameters, label: string): EffectEditorField => ({ key, label, kind: 'color' });
const sel = (key: keyof EffectParameters, label: string, options: readonly string[]): EffectEditorField => ({ key, label, kind: 'select', options });

const CLONE_FIELDS: EffectEditorField[] = [
  num('cloneCount', 'Clone count', 1, 1, 24), num('cloneOpacity', 'Opacity', 0.05, 0, 1),
  num('cloneStartScale', 'Start scale', 0.1, 0.1), num('cloneEndScale', 'End scale', 0.5, 0.5),
  num('cloneLifetime', 'Lifetime (s)', 0.25, 0.1), num('cloneSpreadRadius', 'Spread radius', 1, 0),
  num('cloneMoveSpeed', 'Move speed', 0.5, 0), num('cloneAcceleration', 'Acceleration', 0.5),
  num('cloneBoundaryRadius', 'Boundary radius', 1, 0), num('cloneFadeInDuration', 'Fade in (s)', 0.1, 0),
  num('cloneFadeOutDuration', 'Fade out (s)', 0.1, 0), color('cloneColorTint', 'Tint'),
  num('cloneGlowIntensity', 'Glow', 0.1, 0), num('cloneSpreadDirections', 'Directions (0=sphere)', 1, 0),
  num('cloneStaggerDelay', 'Stagger (s)', 0.02, 0), sel('cloneMaterialMode', 'Material', ['translucent', 'additive', 'hologram']),
  sel('cloneGrowthMode', 'Growth mode', ['inflate', 'spread']), num('cloneClusterRadius', 'Cluster radius (0=centre)', 0.5, 0),
  num('cloneDownOffset', 'Center down offset', 0.1), num('cloneFlashStrength', 'Flash strength', 0.1, 0),
  bool('cloneFollowCurrentModel', 'Use current model'), bool('clonePlayAnimation', 'Play current animation'),
  bool('cloneFaceOutward', 'Face outward'), bool('cloneDisappearOnBoundary', 'Fade at boundary'),
  bool('cloneUseCharacterPose', 'Use character pose'), bool('cloneKeepOriginalPose', 'Keep original pose'),
];
const PARTICLE_FIELDS: EffectEditorField[] = [
  num('particleCount', 'Count', 5, 1, 600), num('particleLifetime', 'Lifetime (s)', 0.1, 0.1),
  num('particleSize', 'Size', 0.05, 0.01), num('particleSizeOverTime', 'Size ×end', 0.1, 0),
  num('particleSpeed', 'Speed', 0.5, 0), num('particleAcceleration', 'Accel', 0.5),
  num('particleGravity', 'Gravity', 0.5), num('particleSpreadRadius', 'Spread radius', 0.5, 0),
  num('particleRandomness', 'Randomness', 0.1, 0, 1), color('particleColorStart', 'Colour start'),
  color('particleColorEnd', 'Colour end'), num('particleOpacityStart', 'Opacity start', 0.1, 0, 1),
  num('particleOpacityEnd', 'Opacity end', 0.1, 0, 1), num('particleOrbitRadius', 'Orbit radius', 0.5, 0),
  num('particleOrbitSpeed', 'Orbit speed', 0.25), sel('particleShape', 'Shape', ['burst', 'starburst', 'ring', 'spiral', 'orbit', 'beam', 'rising', 'ground', 'dome', 'magic_circle']),
];
const PHYSICS_FIELDS: EffectEditorField[] = [
  num('bodyCount', 'Bodies', 5, 1, 500), num('lifetime', 'Lifetime (s)', 0.1, 0.1), num('gravity', 'Gravity', 0.5),
  num('drag', 'Drag', 0.05, 0), num('angularVelocity', 'Angular vel', 0.25), num('outwardForce', 'Outward', 0.5),
  num('inwardForce', 'Inward', 0.5), num('radialForce', 'Radial', 0.5), num('orbitSpeed', 'Orbit speed', 0.25),
  num('orbitRadius', 'Orbit radius', 0.5, 0), num('boundaryRadius', 'Boundary', 1, 0), num('bounceFactor', 'Bounce', 0.1, 0, 1),
  num('randomSeed', 'Seed', 1),
];
const LIGHT_FIELDS: EffectEditorField[] = [
  num('radius', 'Radius', 1, 0), num('ringCount', 'Rings', 1, 1), num('pulseSpeed', 'Pulse speed', 0.25),
  num('thickness', 'Thickness', 0.1, 0), num('flashStrength', 'Flash strength', 0.1, 0),
];

type Cat = { category: EffectCategory; Renderer: EffectRegistryEntry['Renderer']; fields: EffectEditorField[]; defaults: EffectParameters };
const CLONE: Cat = { category: 'clone', Renderer: CloneBurstRenderer, fields: CLONE_FIELDS, defaults: defaultCloneParameters() };
const PARTICLE: Cat = { category: 'particle', Renderer: ParticleRenderer, fields: PARTICLE_FIELDS, defaults: { particleShape: 'starburst' } };
const PHYSICS: Cat = { category: 'physics', Renderer: PhysicsRenderer, fields: PHYSICS_FIELDS, defaults: {} };
const LIGHT: Cat = { category: 'light', Renderer: LightSpaceRenderer, fields: LIGHT_FIELDS, defaults: {} };
const SPACE: Cat = { category: 'space', Renderer: LightSpaceRenderer, fields: LIGHT_FIELDS, defaults: {} };
const CAMERA: Cat = { category: 'camera', Renderer: CameraEffectRenderer, fields: [], defaults: {} };

function catFor(type: EffectTypeV2): Cat {
  if (type.startsWith('clone_') || type === 'transparent_model_echo_effect') return CLONE;
  if (type === 'model_fragment_burst_effect') return PARTICLE;
  if (type.startsWith('camera_') || type === 'time_slow_effect') return CAMERA;
  if (type === 'custom_physics_effect') return PHYSICS;
  if (type === 'custom_model_effect') return CLONE;
  if (type === 'custom_particle_effect') return PARTICLE;
  if (
    type.includes('particle') || type.includes('starburst') || type.includes('spark') || type.includes('aura') ||
    type.includes('rising') || type.includes('orbit') || type.includes('radial_particles') || type.includes('spiral') ||
    type.includes('ground_energy') || type.includes('beam') || type.includes('dust_ring') || type.includes('speed_line')
  ) return PARTICLE;
  if (type.includes('shockwave') || type.includes('radial_burst') || type.includes('energy_dome') || type.includes('screen_flash') || type.includes('space_distortion') || type.includes('ground_crack')) return SPACE;
  // glow / outline / emissive / color_shift / transparency / hologram / energy_material / rim / bloom / model_* / pose_* / custom_* → light
  return LIGHT;
}

const titleCase = (t: string) => t.replace(/_effect$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

let registered = false;
export function ensureEffectsRegistered(): void {
  if (registered) return;
  registered = true;
  // Special cases first (clone family → inflate renderer; model-particle; v1 legacy → editor metadata only).
  for (const type of EFFECT_TYPES_V2) {
    if (isCloneEffectType(type)) {
      registerEffect({ type, label: titleCase(type), category: 'clone', defaultParameters: defaultCloneParameters() as EffectParameters, editorFields: CLONE_FIELDS, Renderer: CloneBurstRenderer });
    } else if (isModelParticleType(type)) {
      registerEffect({ type, label: titleCase(type), category: 'model', defaultParameters: { particleModelScale: 0.4, particleCount: 14 }, editorFields: MODEL_PARTICLE_FIELDS, Renderer: ModelParticleRenderer });
    } else if ((V1_EFFECT_TYPES as readonly string[]).includes(type)) {
      registerEffect({ type, label: titleCase(type), category: v1CategoryOf(type), defaultParameters: { scale: 2, repeat: 14 }, editorFields: V1_FIELDS, Renderer: NullRenderer });
    }
  }
  // Generic category renderers for everything else.
  for (const type of EFFECT_TYPES_V2) {
    if (getEffectEntry(type)) continue;
    const c = catFor(type);
    registerEffect({ type, label: titleCase(type), category: c.category, defaultParameters: { ...c.defaults }, editorFields: c.fields, Renderer: c.Renderer });
  }
}
ensureEffectsRegistered();

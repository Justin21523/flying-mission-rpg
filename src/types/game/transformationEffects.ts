import type { TransformationVec3 } from './transformation';

// Transformation effect system v2 — a parallel, data-driven, registry-backed effect model layered onto the
// existing transformation timeline. Every animation/effect type below is registered (registryEntries.tsx) and
// rendered by a generic CATEGORY renderer (clone / particle / physics / light / space / camera / pose / model)
// with its own default parameters + editor fields, so new effects are added by data, not by if/else sprawl.

export type EffectCategory = 'clone' | 'particle' | 'physics' | 'light' | 'space' | 'camera' | 'pose' | 'model' | 'custom';

// ── Animation types (§三) — drive the actor clip/pose and optionally a bundled effect ──────────────────
export const ANIMATION_TYPES = [
  // basic character poses
  'idle_pose', 'heroic_pose', 'power_up_pose', 'spin_transform', 'jump_transform', 'landing_pose',
  'crouch_charge', 'arms_spread_charge', 'forward_dash_transform', 'aerial_flip_transform', 'dramatic_turnaround', 'final_ready_pose',
  // model-driven
  'model_clone_burst', 'model_afterimage_trail', 'model_scale_projection', 'model_energy_avatar', 'model_shadow_split',
  'model_hologram_expand', 'model_ghost_echo', 'model_weapon_summon', 'model_armor_assemble', 'model_vehicle_transform',
  // particle/energy
  'particle_aura_rise', 'particle_starburst', 'particle_ring_expand', 'particle_spiral_energy', 'particle_ground_spark',
  'particle_orbiting_stars', 'particle_vertical_beam', 'particle_explosion_wave', 'particle_speed_lines', 'particle_magic_circle',
  // physics
  'physics_burst_outward', 'physics_orbit_motion', 'physics_falling_sparks', 'physics_shockwave_push', 'physics_clone_expansion',
  'physics_energy_pull_in', 'physics_radial_scatter', 'physics_gravity_float', 'physics_acceleration_dash', 'physics_spring_scale',
  // camera/presentation
  'camera_closeup', 'camera_orbit_around_character', 'camera_low_angle_hero_shot', 'camera_zoom_burst', 'camera_slow_motion_focus',
  'camera_shake_impact', 'camera_pull_back_reveal', 'camera_spin_reveal',
  // custom
  'custom_model_effect', 'custom_particle_effect', 'custom_shader_effect', 'custom_timeline_effect', 'custom_camera_effect', 'custom_combo_effect',
] as const;
export type AnimationType = (typeof ANIMATION_TYPES)[number];

// ── Effect types (§四) ─────────────────────────────────────────────────────────────────────────────────
export const EFFECT_TYPES_V2 = [
  // model / clone
  'clone_burst_effect', 'clone_ring_effect', 'clone_directional_split_effect', 'clone_afterimage_trail_effect',
  'clone_giant_projection_effect', 'transparent_model_echo_effect', 'model_scale_pulse_effect', 'model_glow_outline_effect',
  'model_material_shift_effect', 'model_dissolve_effect', 'model_reassemble_effect', 'model_fragment_burst_effect',
  // particle
  'starburst_effect', 'spark_burst_effect', 'aura_particles_effect', 'rising_particles_effect', 'orbit_particles_effect',
  'radial_particles_effect', 'spiral_particles_effect', 'ground_energy_effect', 'beam_particles_effect', 'dust_ring_effect', 'speed_line_effect',
  // light / material
  'glow_aura_effect', 'outline_glow_effect', 'emissive_pulse_effect', 'color_shift_effect', 'transparency_fade_effect',
  'hologram_effect', 'energy_material_effect', 'rim_light_effect', 'bloom_flash_effect',
  // impact / space
  'shockwave_ring_effect', 'radial_burst_effect', 'energy_dome_effect', 'screen_flash_effect', 'camera_shake_effect',
  'time_slow_effect', 'space_distortion_effect', 'ground_crack_effect',
  // pose / camera
  'heroic_pose_effect', 'pose_hold_effect', 'camera_orbit_effect', 'camera_zoom_effect', 'camera_low_angle_effect',
  'camera_focus_character_effect', 'camera_transition_effect',
  // custom
  'custom_effect', 'custom_model_effect', 'custom_particle_effect', 'custom_physics_effect', 'custom_shader_effect', 'custom_composite_effect',
  // model-particle (real GLB models used as particles)
  'model_particle_burst', 'model_debris_field', 'model_orbit_swarm', 'model_rain', 'model_rising_swarm',
  // legacy v1 effect-type names (unified into the one list; rendered by the bespoke v1 components, except
  // ghost-burst which now uses the rebuilt inflate clone renderer)
  'particle-burst', 'energy-ring', 'glow-pulse', 'white-flash', 'outline', 'speed-line-burst', 'thruster-flare', 'sparkle', 'ghost-burst', 'cloud-ripple-burst',
] as const;
export type EffectTypeV2 = (typeof EFFECT_TYPES_V2)[number];

// v1 legacy types render via the bespoke components (EffectViz); everything else via the registry renderers.
export const V1_EFFECT_TYPES: readonly EffectTypeV2[] = ['particle-burst', 'energy-ring', 'glow-pulse', 'white-flash', 'outline', 'speed-line-burst', 'thruster-flare', 'sparkle', 'cloud-ripple-burst'];
export const isV1EffectType = (t: EffectTypeV2): boolean => (V1_EFFECT_TYPES as readonly string[]).includes(t);
export const isCloneEffectType = (t: EffectTypeV2): boolean => t === 'ghost-burst' || t.startsWith('clone_') || t === 'transparent_model_echo_effect';
export const isModelParticleType = (t: EffectTypeV2): boolean => t.startsWith('model_particle') || t === 'model_debris_field' || t === 'model_orbit_swarm' || t === 'model_rain' || t === 'model_rising_swarm';

export type AnyEffectType = EffectTypeV2 | AnimationType;
export type BlendMode = 'normal' | 'additive' | 'multiply';

// ── Parameter groups (§六/七/八) ─────────────────────────────────────────────────────────────────────
export interface CloneEffectParameters {
  cloneCount: number;
  cloneOpacity: number;
  cloneStartScale: number;
  cloneEndScale: number;
  cloneLifetime: number;
  cloneSpreadRadius: number;
  cloneMoveSpeed: number;
  cloneAcceleration: number;
  cloneRotationSpeed: number;
  cloneSpreadDirections: number; // 0 = even sphere; else N fan directions in the XZ plane (+ up bias)
  cloneFadeInDuration: number;
  cloneFadeOutDuration: number;
  cloneBoundaryRadius: number;
  cloneDisappearOnBoundary: boolean;
  cloneUseCharacterPose: boolean;
  cloneKeepOriginalPose: boolean;
  cloneFaceOutward: boolean;
  cloneColorTint: string;
  cloneGlowIntensity: number;
  cloneMaterialMode: 'translucent' | 'additive' | 'hologram';
  cloneStaggerDelay: number;
  cloneVerticalBias: number;
  cloneGrowthMode: 'inflate' | 'spread'; // inflate = grow huge in place; spread = fly outward (legacy)
  cloneClusterRadius: number;            // inflate: initial offset of each clone around the body (0 = overlap centre)
  cloneFadeScaleThreshold: number;       // inflate: fade once scale ≥ cloneEndScale × this (0..1)
  cloneFlashStrength: number;            // bright additive flash at the character centre as clones appear (0 = off)
  cloneFollowCurrentModel: boolean;      // clone uses the character's CURRENT model (live, updates if it swaps)
  clonePlayAnimation: boolean;           // play the character's current animation clip on the clones
  cloneDownOffset: number;               // inflate: shift DOWN by this × scale-growth so a feet-pivoted model stays centred
  // bundled sub-effects (the cinematic combo)
  starburstEnabled: boolean;
  starburstParticleCount: number;
  shockwaveEnabled: boolean;
  shockwaveRadius: number;
  heroicPoseEnabled: boolean;
  cameraLowAngleEnabled: boolean;
}

export interface ParticleEffectParameters {
  particleCount: number;
  spawnRate: number;
  particleLifetime: number;
  particleSize: number;
  particleSizeOverTime: number; // multiplier at end of life
  particleSpeed: number;
  particleAcceleration: number;
  particleGravity: number;
  particleDrag: number;
  particleSpreadRadius: number;
  particleDirection: TransformationVec3;
  particleRandomness: number;
  particleColorStart: string;
  particleColorEnd: string;
  particleOpacityStart: number;
  particleOpacityEnd: number;
  particleShape: 'burst' | 'ring' | 'spiral' | 'orbit' | 'beam' | 'rising' | 'ground' | 'starburst' | 'dome' | 'magic_circle';
  particleOrbitRadius: number;
  particleOrbitSpeed: number;
  particleBurstAmount: number;
  particleTrailLength: number;
  // model-particle: spawn a real GLB model as each particle
  particleModelId?: string;
  particleModelScale?: number;
  particleModelSpin?: number;
}

// Legacy v1 effect parameters (carried over when migrating effectTracks → unified configs).
export interface LegacyV1Parameters {
  scale: number;
  repeat: number;
  ghostSpread: number;
  ghostPersist: boolean;
  ringCount: number;
}

export interface PhysicsEffectParameters {
  initialVelocity: TransformationVec3;
  acceleration: TransformationVec3;
  gravity: number;
  drag: number;
  angularVelocity: number;
  radialForce: number;
  outwardForce: number;
  inwardForce: number;
  orbitSpeed: number;
  orbitRadius: number;
  springStrength: number;
  damping: number;
  boundaryRadius: number;
  collisionEnabled: boolean;
  bounceFactor: number;
  lifetime: number;
  randomSeed: number;
  bodyCount: number;
}

export interface LightEffectParameters {
  radius: number;
  ringCount: number;
  pulseSpeed: number;
  thickness: number;
  flashStrength: number;
  shakeIntensity: number;
  timeScale: number; // time_slow
}

// One bag — every effect reads only the fields its renderer needs; the editor shows the schema's fields.
export type EffectParameters = Partial<CloneEffectParameters & ParticleEffectParameters & PhysicsEffectParameters & LightEffectParameters & LegacyV1Parameters>;

export interface TransformationEffectConfig {
  effectId: string;
  effectName: string;
  effectType: EffectTypeV2;
  enabled: boolean;
  startTime: number;
  duration: number;
  delay: number;
  layerOrder: number;
  targetCharacterId?: string;
  targetModelId?: string;
  attachToBone: boolean;
  attachBoneName?: string;
  useCharacterModel: boolean;
  useCustomModel: boolean;
  customModelPrefabId?: string;
  positionOffset: TransformationVec3;
  rotationOffset: TransformationVec3; // degrees
  scaleMultiplier: number;
  opacity: number;
  fadeInDuration: number;
  fadeOutDuration: number;
  color: string;
  emissiveColor: string;
  intensity: number;
  blendMode: BlendMode;
  loop: boolean;
  previewEnabled: boolean;
  soundId?: string; // sfx played when the effect starts (synth SfxName e.g. 'transform', or a cue id 'fx.boost')
  parameters: EffectParameters;
  // Batch F.5 — when this effect is driven by a COMBAT cast (not the transformation timeline), the combat tick
  // sets+refreshes an explicit world anchor here each frame (follows the caster/target). Transformation
  // effects leave this undefined and anchor to the live transforming actor (currentActor). Additive/optional.
  runtimeAnchor?: { x: number; y: number; z: number; heading?: number };
  source?: 'transformation' | 'combat';
}

// Resolved at a time by evaluateEffectsAtTime — what the renderer consumes each frame.
export interface ActiveEffectV2 {
  config: TransformationEffectConfig;
  localTime: number; // seconds within [0, duration]
  progress: number;  // 0..1 across duration
}

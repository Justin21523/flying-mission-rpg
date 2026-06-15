import type { CloneEffectParameters } from '../../../types/game/transformationEffects';

// Pure, deterministic clone-burst sampling — given a clone index + the effect progress (0..1), returns that
// clone's transform/opacity. No allocation of THREE objects, no per-frame state: the renderer just reads this
// every frame, and timeline scrubbing to any time shows the exact same state (deterministic). Tested.

export type Vec3 = [number, number, number];

export interface CloneState {
  position: Vec3;
  scale: number;
  opacity: number;
  rotationY: number;
  visible: boolean;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const easeIn = (t: number) => t * t;

// §十二 default clone-burst preset.
export function defaultCloneParameters(): CloneEffectParameters {
  return {
    cloneCount: 4,
    cloneOpacity: 0.4,
    cloneStartScale: 1.0,
    cloneEndScale: 12.0,
    cloneLifetime: 4.0,
    cloneSpreadRadius: 20,
    cloneMoveSpeed: 6,
    cloneAcceleration: 2,
    cloneRotationSpeed: 0,
    cloneSpreadDirections: 0,
    cloneFadeInDuration: 0.3,
    cloneFadeOutDuration: 1.2,
    cloneBoundaryRadius: 25,
    cloneDisappearOnBoundary: true,
    cloneUseCharacterPose: true,
    cloneKeepOriginalPose: true,
    cloneFaceOutward: true,
    cloneColorTint: '#7fd0ff',
    cloneGlowIntensity: 1,
    cloneMaterialMode: 'translucent',
    cloneStaggerDelay: 0.06,
    cloneVerticalBias: 0.25,
    cloneGrowthMode: 'inflate',
    cloneClusterRadius: 0, // overlap the character centre → symmetric inflate stays centred in view
    cloneFadeScaleThreshold: 0.8,
    cloneFlashStrength: 1,
    cloneFollowCurrentModel: true,
    clonePlayAnimation: true,
    cloneDownOffset: 0.6,
    starburstEnabled: true,
    starburstParticleCount: 120,
    shockwaveEnabled: true,
    shockwaveRadius: 15,
    heroicPoseEnabled: true,
    cameraLowAngleEnabled: true,
  };
}

// Unit direction for clone `index` of `count`. Even ring (XZ) with an up bias, or N fan directions.
export function cloneDirection(index: number, count: number, params: CloneEffectParameters): Vec3 {
  const dirs = params.cloneSpreadDirections > 0 ? params.cloneSpreadDirections : count;
  const slot = dirs > 0 ? index % dirs : index;
  const a = (slot / Math.max(1, dirs)) * Math.PI * 2;
  // alternate clones get a small vertical component so the burst reads as 3D, not a flat ring.
  const up = params.cloneVerticalBias * (index % 3 === 0 ? 1.4 : index % 3 === 1 ? 0.4 : -0.2);
  const x = Math.cos(a);
  const z = Math.sin(a);
  const len = Math.hypot(x, up, z) || 1;
  return [x / len, up / len, z / len];
}

export function cloneTransformAt(index: number, params: CloneEffectParameters, progress: number): CloneState {
  const life = Math.max(0.1, params.cloneLifetime);
  const staggerNorm = clamp01((params.cloneStaggerDelay * index) / life);
  // each clone's own 0..1 progress after its stagger delay
  const local = staggerNorm >= 1 ? 0 : clamp01((progress - staggerNorm) / (1 - staggerNorm));
  const tt = local * life; // seconds since this clone started
  const dir = cloneDirection(index, params.cloneCount, params);
  const fadeInFrac = clamp01(params.cloneFadeInDuration / life);

  if ((params.cloneGrowthMode ?? 'inflate') === 'inflate') {
    // INFLATE — clones barely move (overlap the body centre) and continuously SCALE UP toward cloneEndScale;
    // they stay fully visible while growing and only fade once near-max (huge). A downward offset proportional
    // to the scale growth keeps a feet-pivoted model centred as it inflates (cloneDownOffset).
    const cluster = params.cloneClusterRadius ?? 0;
    const scale = params.cloneStartScale + (params.cloneEndScale - params.cloneStartScale) * easeIn(local);
    const down = (scale - params.cloneStartScale) * (params.cloneDownOffset ?? 0);
    const position: Vec3 = [dir[0] * cluster, dir[1] * cluster * 0.5 - down, dir[2] * cluster];
    const grown = (params.cloneEndScale - params.cloneStartScale) > 0
      ? (scale - params.cloneStartScale) / (params.cloneEndScale - params.cloneStartScale) : local; // 0..1 size
    const thr = params.cloneFadeScaleThreshold ?? 0.8;
    let env = 1;
    if (fadeInFrac > 0 && local < fadeInFrac) env = local / fadeInFrac; // quick fade-in
    if (grown > thr) env = Math.min(env, Math.max(0, 1 - (grown - thr) / (1 - thr))); // fade once huge
    const opacity = params.cloneOpacity * env;
    const rotationY = params.cloneRotationSpeed * tt;
    return { position, scale, opacity, rotationY, visible: local > 0 && opacity > 0.002 };
  }

  // SPREAD (legacy) — clones fly outward, grow, and fade as they reach the boundary distance.
  const maxDist = Math.min(params.cloneSpreadRadius, params.cloneBoundaryRadius);
  const raw = params.cloneMoveSpeed * tt + 0.5 * params.cloneAcceleration * tt * tt;
  const dist = Math.min(raw, maxDist);
  const position: Vec3 = [dir[0] * dist, dir[1] * dist, dir[2] * dist];
  const scale = params.cloneStartScale + (params.cloneEndScale - params.cloneStartScale) * easeOut(local);
  const fadeOutFrac = clamp01(params.cloneFadeOutDuration / life);
  let env = 1;
  if (fadeInFrac > 0 && local < fadeInFrac) env = local / fadeInFrac;
  else if (fadeOutFrac > 0 && local > 1 - fadeOutFrac) env = Math.max(0, (1 - local) / fadeOutFrac);
  let boundaryFade = 1;
  if (params.cloneDisappearOnBoundary && maxDist > 0) {
    const near = dist / maxDist;
    if (near > 0.85) boundaryFade = Math.max(0, 1 - (near - 0.85) / 0.15);
  }
  const opacity = params.cloneOpacity * env * boundaryFade;
  const rotationY = (params.cloneFaceOutward ? Math.atan2(dir[0], dir[2]) : 0) + params.cloneRotationSpeed * tt;
  return { position, scale, opacity, rotationY, visible: local > 0 && opacity > 0.002 };
}

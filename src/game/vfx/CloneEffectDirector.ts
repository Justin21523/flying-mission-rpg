import type { CinematicEffectDefinition, CinematicEffectLayerDefinition, CinematicEffectFamily } from '../../types/cinematicVfxTypes';
import type { EffectTypeV2 } from '../../types/game/transformationEffects';
import type { CloneAbilityDefinition, CloneType, CloneSpawnPattern } from '../../types/cloneAbilityTypes';
import { mLayer, pLayer, gLayer, fLayer, camLayer } from '../../data/cinematic-vfx/cinematicVfxBuilders';
import { GEOM_PRESETS } from '../../data/cinematic-vfx/geometryEffectPresets';
import { PARTICLE_PRESETS } from '../../data/cinematic-vfx/particlePresets';
import { FOG_PRESETS } from '../../data/cinematic-vfx/fogCloudPresets';
import { CAMERA_PRESETS } from '../../data/cinematic-vfx/cameraFeedbackPresets';
import { getStyleProfile } from '../../data/cinematic-vfx/characterVfxStyleProfiles';
import { poseKeyframes } from './CloneStateTimelineRuntime';

// Clone effect director (Batch F.7) — turns a CloneAbilityDefinition into a CinematicEffectDefinition that the
// EXISTING cinematic runtime plays. The clone's spawn → pose-switch → action → dissolve sequence is authored as
// staggered model-component layers (one per pose keyframe, with the clone's material mode), plus a themed
// particle accent, an action geometry layer, a dissolve fog, and camera feedback. This reuses ModelParticleRenderer
// (no new renderer) and guarantees the model + particle + geometry/fog completeness contract.

const FAMILY: Record<string, CinematicEffectFamily> = {
  char_jett: 'speed', char_jerome: 'dance', char_paul: 'police', char_donnie: 'engineering',
  char_todd: 'drill', char_flip: 'sport', char_bello: 'wild', char_chase: 'stealth',
};

const V2_FOR_SHAPE: Record<'burst' | 'orbit' | 'rising', EffectTypeV2> = {
  burst: 'model_particle_burst', orbit: 'model_orbit_swarm', rising: 'model_rising_swarm',
};

function shapeForPattern(pattern: CloneSpawnPattern): 'burst' | 'orbit' | 'rising' {
  if (pattern === 'orbit-caster' || pattern === 'around-target') return 'orbit';
  if (pattern === 'line-formation' || pattern === 'path-markers') return 'rising';
  return 'burst';
}

// Action geometry layer per clone type (lock lines for strikes, dome for guard, ground ring for support, big
// shock ring for ultimate echoes).
function actionGeometry(cloneType: CloneType, color: string, start: number): CinematicEffectLayerDefinition {
  switch (cloneType) {
    case 'defense-double': return gLayer('geometry-mesh', GEOM_PRESETS.scanCone(8), 'energy_dome_effect', color, start, 0.5);
    case 'support-double': return gLayer('ground-marker', GEOM_PRESETS.groundMarker(6), 'shockwave_ring_effect', color, start, 0.5, 'target');
    case 'ultimate-double': return gLayer('geometry-mesh', GEOM_PRESETS.shockRing(9), 'shockwave_ring_effect', color, start, 0.5);
    default: return gLayer('lock-line', GEOM_PRESETS.lockLine(11), 'radial_burst_effect', color, start, 0.4, 'target');
  }
}

function actionParticle(cloneType: CloneType, color: string, dur: number): CinematicEffectLayerDefinition {
  if (cloneType === 'attack-double') return pLayer(PARTICLE_PRESETS.sparks(color), color, 0, Math.min(0.6, dur), 'spark_burst_effect');
  return pLayer(PARTICLE_PRESETS.auraPulse(color), color, 0, Math.min(0.7, dur), 'aura_particles_effect');
}

const TYPE_WORD: Record<CloneType, string> = {
  'attack-double': 'attack', 'defense-double': 'defense', 'support-double': 'support', 'ultimate-double': 'ultimate',
};

export function buildCloneEffect(def: CloneAbilityDefinition, color: string): CinematicEffectDefinition {
  const effectId = `${def.abilityId}_fx`;
  const short = def.characterId.replace('char_', '');
  const sigKey = `${short}_clone_${TYPE_WORD[def.cloneType]}`;
  const shape = shapeForPattern(def.spawnPattern);
  const v2 = V2_FOR_SHAPE[shape];
  const dur = def.durationSeconds;
  const vc = def.visualConfig;
  const layers: CinematicEffectLayerDefinition[] = [];

  // One model layer per pose beat (spawn idle → switch to action/defense pose → dissolve pose), staggered in
  // time so the clone visibly CHANGES pose over its life (the runtime delays each layer by startTimeSeconds).
  const poses = poseKeyframes(def.stateTimeline);
  poses.forEach((kf, i) => {
    const next = poses[i + 1];
    const layerDur = Math.max(0.4, (next ? next.time : dur) - kf.time + 0.2);
    layers.push(mLayer(
      'model-component',
      { modelAssetId: kf.poseModelId, shape, count: def.maxCloneCount, scale: vc.modelScaleMultiplier, spin: 1.2, spreadRadius: 2.6, materialMode: vc.materialMode },
      v2, color, kf.time, layerDur,
    ));
  });
  // Fallback: if the timeline somehow had no pose beats, ensure at least one model layer (completeness contract).
  if (poses.length === 0) {
    layers.push(mLayer('model-component', { modelAssetId: def.poseModelSet.actionPoseModelId || def.poseModelSet.fallbackModelId, shape, count: def.maxCloneCount, scale: vc.modelScaleMultiplier, spin: 1.2, spreadRadius: 2.6, materialMode: vc.materialMode }, v2, color, 0, dur));
  }

  // Particle accent + action geometry + dissolve fog + camera feedback.
  layers.push(actionParticle(def.cloneType, color, dur));
  layers.push(actionGeometry(def.cloneType, color, +(dur * 0.4).toFixed(3)));
  layers.push(fLayer(FOG_PRESETS.smokeRing(color), color, +(dur * 0.7).toFixed(3), Math.max(0.3, dur * 0.35)));
  layers.push(def.cloneType === 'ultimate-double' ? camLayer(CAMERA_PRESETS.ultimate()) : camLayer(CAMERA_PRESETS.heavyHit()));

  const motion = getStyleProfile(def.characterId)?.motionLanguage ?? 'fast-linear';
  return {
    id: effectId, name: def.name, effectFamily: FAMILY[def.characterId] ?? 'generic',
    characterId: def.characterId, signatureObjectIds: [sigKey], motionLanguage: motion,
    layers,
    timeline: { totalDurationSeconds: dur },
    pooling: { poolId: `cvfx_${def.characterId}`, reusable: true },
    cleanup: { autoCleanup: true, cleanupDelaySeconds: 0.2 },
  };
}

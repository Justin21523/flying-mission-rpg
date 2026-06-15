import type {
  CinematicEffectDefinition, CinematicEffectLayerDefinition, CinematicEffectFamily, CinematicLayerType, CinematicAttachTo,
} from '../../types/cinematicVfxTypes';
import type { EffectTypeV2 } from '../../types/game/transformationEffects';
import type { GeometryEffectDefinition } from '../../types/game/combat';
import type { ParticleLayerSettings } from '../../types/particleEffectTypes';
import type { FogCloudLayerSettings } from '../../types/fogCloudEffectTypes';
import type { ModelLayerSettings } from '../../types/modelEffectTypes';
import type { CinematicCameraFeedbackSettings } from '../../types/cinematicVfxTypes';
import type { PhysicsVfxObjectDefinition } from '../../types/physicsVfxTypes';

// Layer + effect builders (Batch F.5). Each ability gets a UNIQUE, model-first, family-themed
// CinematicEffectDefinition assembled from presets + its own id/color/scale. Particles are always an accent
// to a model/geometry/object layer (§15).
let lid = 0;
const L = (
  layerType: CinematicLayerType,
  v2EffectType: EffectTypeV2,
  attachTo: CinematicAttachTo,
  start: number,
  dur: number,
  extra: Partial<CinematicEffectLayerDefinition>,
): CinematicEffectLayerDefinition => ({ id: `l${lid++}`, layerType, v2EffectType, attachTo, startTimeSeconds: start, durationSeconds: dur, ...extra });

export const pLayer = (particle: ParticleLayerSettings, color: string, start = 0, dur = 0.5, v2: EffectTypeV2 = 'starburst_effect', attach: CinematicAttachTo = 'character-root'): CinematicEffectLayerDefinition =>
  L('particle-burst', v2, attach, start, dur, { particle, color });
export const fLayer = (fogCloud: FogCloudLayerSettings, color: string, start = 0, dur = 0.7, attach: CinematicAttachTo = 'character-root'): CinematicEffectLayerDefinition =>
  L('fog-cloud', 'dust_ring_effect', attach, start, dur, { fogCloud, color });
export const gLayer = (layerType: CinematicLayerType, geometry: GeometryEffectDefinition, v2: EffectTypeV2, color: string, start = 0, dur = 0.5, attach: CinematicAttachTo = 'character-root'): CinematicEffectLayerDefinition =>
  L(layerType, v2, attach, start, dur, { geometry, color });
export const mLayer = (layerType: CinematicLayerType, model: ModelLayerSettings, v2: EffectTypeV2, color: string, start = 0, dur = 0.8, attach: CinematicAttachTo = 'character-root'): CinematicEffectLayerDefinition =>
  L(layerType, v2, attach, start, dur, { model, color });
export const camLayer = (camera: CinematicCameraFeedbackSettings): CinematicEffectLayerDefinition =>
  L('camera-feedback', 'camera_shake_effect', 'screen-ui', 0, 0.4, { camera });
// Batch F.6 — a physics-object layer (debris/panels/balls/rubble). The v2EffectType is unused (the director
// routes physics-object layers to the PhysicsVfxDirector), but the type requires one.
export const physLayer = (physicsObject: PhysicsVfxObjectDefinition, start = 0, dur = 1.4, attach: CinematicAttachTo = 'character-root'): CinematicEffectLayerDefinition =>
  L('physics-object', 'starburst_effect', attach, start, dur, { physicsObject });

export function fxDef(id: string, name: string, family: CinematicEffectFamily, layers: CinematicEffectLayerDefinition[], totalDur: number): CinematicEffectDefinition {
  return {
    id, name, effectFamily: family, layers,
    timeline: { totalDurationSeconds: totalDur },
    pooling: { poolId: `cvfx_${family}`, reusable: true },
    cleanup: { autoCleanup: true, cleanupDelaySeconds: 0.2 },
  };
}

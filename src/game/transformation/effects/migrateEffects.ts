import type { TransformationEffectTrack } from '../../../types/game/transformation';
import type { EffectTypeV2, TransformationEffectConfig } from '../../../types/game/transformationEffects';

// Pure (no R3F) — convert a legacy v1 effect track → a unified TransformationEffectConfig, so v1 + v2 effects
// live in one list. Used by the seed data and the editor-store migration. The v1 type names are part of the
// unified effect-type set, so `t.type` is a valid effectType.
export function effectTrackToConfig(t: TransformationEffectTrack): TransformationEffectConfig {
  return {
    effectId: t.id, effectName: t.type.replace(/[_-]/g, ' '), effectType: t.type as EffectTypeV2, enabled: true,
    startTime: t.startTime, duration: t.duration, delay: 0, layerOrder: 0, attachToBone: false,
    useCharacterModel: true, useCustomModel: false, positionOffset: t.spawnOffset ?? [0, 0, 0], rotationOffset: [0, 0, 0],
    scaleMultiplier: 1, opacity: 1, fadeInDuration: 0.2, fadeOutDuration: Math.min(1, t.duration * 0.4),
    color: t.color ?? '#ffffff', emissiveColor: t.color ?? '#ffffff', intensity: t.intensity ?? 1,
    blendMode: 'additive', loop: false, previewEnabled: true,
    parameters: { scale: t.scale, repeat: t.repeat, ghostSpread: t.ghostSpread, ghostPersist: t.ghostPersist, ringCount: t.ringCount, particleCount: t.particleCount },
  };
}

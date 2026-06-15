import { nanoid } from 'nanoid';
import { getEffectEntry } from './registry';
import './registryEntries'; // ensure registered
import type { EffectTypeV2, TransformationEffectConfig } from '../../../types/game/transformationEffects';

// Build a ready-to-use effect config from a registered type (registry defaults + sensible config defaults).
// Shared by the editor "Add effect" action and the seed data.
export function createDefaultEffectConfig(effectType: EffectTypeV2, startTime = 0, layerOrder = 0): TransformationEffectConfig {
  const entry = getEffectEntry(effectType);
  const duration = effectType.startsWith('clone_') ? 4 : effectType.includes('flash') ? 0.6 : effectType.includes('shockwave') || effectType.includes('radial_burst') ? 1.2 : 1.6;
  return {
    effectId: `fx_${nanoid(6)}`,
    effectName: entry?.label ?? effectType,
    effectType,
    enabled: true,
    startTime,
    duration,
    delay: 0,
    layerOrder,
    attachToBone: false,
    useCharacterModel: true,
    useCustomModel: false,
    positionOffset: [0, 0, 0],
    rotationOffset: [0, 0, 0],
    scaleMultiplier: 1,
    opacity: 1,
    fadeInDuration: 0.3,
    fadeOutDuration: Math.min(1.2, duration * 0.4),
    color: '#7fd0ff',
    emissiveColor: '#7fd0ff',
    intensity: 1,
    blendMode: 'additive',
    loop: false,
    previewEnabled: true,
    parameters: { ...(entry?.defaultParameters ?? {}) },
  };
}

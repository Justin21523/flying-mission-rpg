import type { MultiCharacterLimitConfig } from '../../types/game/support';
import type { QualityPreset, QualityTier } from '../../types/game/quality';
import { CUSTOM_PRESET_BASE, QUALITY_PRESETS } from '../../data/configuration/qualityPresets';
import { validateQualityPreset } from './qualityPresetSchema';
import { useGraphicsSettingsStore } from '../../stores/graphicsSettingsStore';
import { useAudioStore } from '../../stores/audioStore';
import { getEditorQualityPreset } from '../../stores/game/editorQualityStore';
import { useEditorSupportStore } from '../../stores/game/editorSupportStore';

// Batch 12 — pure-ish mapper from the selected quality tier to the concrete knobs the runtime reads.
// Source of truth = graphicsSettingsStore (tier + custom patch); authored values come from the editor
// quality store; reduce-motion (audioStore) overrides motion-heavy knobs. It writes the Active/Standby
// limits + AI tick rates back through editorSupportStore so Batch-8 stays the single owner of those.

/** Resolve the base preset for a tier (editor override → seed → custom base + patch). Never throws. */
export function resolveTierPreset(tier: QualityTier, customPatch: Partial<QualityPreset>): QualityPreset {
  if (tier === 'custom') {
    const merged: QualityPreset = { ...CUSTOM_PRESET_BASE, ...customPatch, id: 'custom', label: 'Custom' };
    return validateQualityPreset(merged).ok ? merged : QUALITY_PRESETS.medium;
  }
  const authored = getEditorQualityPreset(tier);
  if (authored && validateQualityPreset(authored).ok) return authored;
  return QUALITY_PRESETS[tier] ?? QUALITY_PRESETS.medium;
}

/** Force motion-heavy / flashing knobs off/down. Pure. */
export function applyReduceMotionOverrides(preset: QualityPreset, reduceMotion: boolean): QualityPreset {
  if (!reduceMotion) return preset;
  return {
    ...preset,
    cameraShakeEnabled: false,
    dynamicFovEnabled: false,
    speedLinesEnabled: false,
    airDistortionEnabled: false,
    // Keep clouds/particles but never at full flashing intensity.
    particleQuality: preset.particleQuality === 'high' ? 'medium' : preset.particleQuality,
    transformationEffectQuality: preset.transformationEffectQuality === 'high' ? 'medium' : preset.transformationEffectQuality,
  };
}

/** The Batch-8 limit patch implied by a quality preset. Pure. */
export function supportLimitsForPreset(preset: QualityPreset): Partial<MultiCharacterLimitConfig> {
  return {
    maxActiveCharacters: preset.maxActiveCharacters,
    maxStandbyCharacters: preset.maxStandbyCharacters,
    aiTickRateActive: preset.aiTickRateActive,
    aiTickRateStandby: preset.aiTickRateStandby,
  };
}

/** The effective preset right now (tier + custom patch + reduce-motion). Reads stores; non-hook. */
export function effectiveQualityPreset(): QualityPreset {
  const g = useGraphicsSettingsStore.getState();
  const reduceMotion = useAudioStore.getState().reduceMotion;
  return applyReduceMotionOverrides(resolveTierPreset(g.tier, g.customPreset), reduceMotion);
}

/** Push the effective preset's character/AI budgets into the Batch-8 support limits (single owner). */
export function applyQualityToSupportLimits(): void {
  const patch = supportLimitsForPreset(effectiveQualityPreset());
  useEditorSupportStore.getState().updateLimits(patch);
}

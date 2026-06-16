import type { AbilityCategory, AbilityVisualScale, CinematicModelScalePreset } from '../../types/abilityArsenalTypes';

// Batch F.6 — model-scale tiers. The renderer (ModelParticleRenderer) draws each VFX model normalized to a
// fixed unit height then multiplies by the layer's `scale`. These presets multiply that authored base so a
// whole tier of abilities reads at a deliberate on-screen size: basic attacks clearly visible, defenses
// chunky, signatures large, ultimates with giant presence — without hand-tuning a scalar per piece. Values are
// relative boosts over the authored base (not absolute), and are clamped per-layer so nothing fills the frame.
export const MODEL_SCALE_PRESETS: Record<CinematicModelScalePreset, number> = {
  small: 1.0,
  medium: 1.6,
  large: 1.9,
  hero: 2.2,
  ultimate: 2.6,
};

// Hard ceiling on a single model layer's final scale (over the ~1.4u normalized base) so even an already-large
// authored "giant projection" piece (~3.0) times the ultimate tier can't grow past a readable cinematic size.
export const MAX_MODEL_LAYER_SCALE = 4.5;

// Default preset per ability category — drives both the on-screen model size and the ability's visualScale.
export function presetForCategory(category: AbilityCategory): CinematicModelScalePreset {
  switch (category) {
    case 'ultimate': return 'ultimate';
    case 'signature': return 'hero';
    case 'clone': return 'hero';
    case 'defense': return 'large';
    default: return 'medium';
  }
}

export function modelScaleMultiplierForCategory(category: AbilityCategory): number {
  return MODEL_SCALE_PRESETS[presetForCategory(category)];
}

// The seed visualScale for an ability of the given category (geometry/particle/fog kept at 1.0 by default —
// Edit-Mode can retune any channel).
export function visualScaleForCategory(category: AbilityCategory): AbilityVisualScale {
  const preset = presetForCategory(category);
  return {
    modelScalePreset: preset,
    modelScaleMultiplier: MODEL_SCALE_PRESETS[preset],
    geometryScaleMultiplier: 1,
    particleScaleMultiplier: 1,
    fogScaleMultiplier: 1,
  };
}

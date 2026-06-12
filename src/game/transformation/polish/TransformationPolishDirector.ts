import type { TransformationPolishPreset, QuickModePolishLevel } from '../../../types/game/transformationPolish';
import { getEditorTransformationPolishForCharacter } from '../../../stores/game/editorTransformationPolishStore';
import { getEditorCharacter } from '../../../stores/game/editorCharacterStore';
import { useAudioStore } from '../../../stores/audioStore';
import { validateTransformationPolish } from './transformationPolishSchema';

// Batch 12 — resolves the effective transformation polish for a character. Authored preset → validated →
// reduce-motion overrides. When no preset exists it synthesises one from the character's own `color`, so
// every character has a coherent theme/backdrop with zero authoring. Pure `applyReduceMotion` is tested.

const DEFAULT_COLOR = '#7fd0ff';

function fallbackForCharacter(characterId: string): TransformationPolishPreset {
  const color = getEditorCharacter(characterId)?.color ?? DEFAULT_COLOR;
  return {
    id: `xfpolish_auto_${characterId}`,
    characterId,
    themeColor: color,
    particleStyle: 'rescue',
    energyRingColor: color,
    backdropPulseIntensity: 1,
    quickModePolishLevel: 'standard',
  };
}

/** Reduce-motion caps the quick-mode polish at minimal and dims the backdrop pulse. Pure. */
export function applyReduceMotion(preset: TransformationPolishPreset, reduceMotion: boolean): TransformationPolishPreset {
  if (!reduceMotion) return preset;
  const capped: QuickModePolishLevel = 'minimal';
  return { ...preset, quickModePolishLevel: capped, backdropPulseIntensity: Math.min(preset.backdropPulseIntensity, 0.5) };
}

/** The effective polish preset for a character right now (authored/fallback + reduce-motion). */
export function resolveTransformationPolish(characterId: string): TransformationPolishPreset {
  const authored = getEditorTransformationPolishForCharacter(characterId);
  const base = authored && validateTransformationPolish(authored).ok ? authored : fallbackForCharacter(characterId);
  return applyReduceMotion(base, useAudioStore.getState().reduceMotion);
}

// Batch 12 — the unified, data-driven quality preset. Richer than the renderer-only QualityLevel in
// `game/render/renderSettings.ts` (which stays the single source for dpr/shadow/character knobs): this
// preset adds the polish/effect/AI-budget knobs the rest of Batch 12 reads, and maps DOWN to a renderer
// QualityLevel so there is no second source for the Canvas. Authoring lives in the ⚙ Quality editor tab;
// the selected tier + a custom override patch live in `graphicsSettingsStore` (one settings source).

import type { QualityLevel } from '../../game/render/renderSettings';

export type QualityTier = 'low' | 'medium' | 'high' | 'ultra' | 'custom';
export const QUALITY_TIERS: readonly QualityTier[] = ['low', 'medium', 'high', 'ultra', 'custom'];

export type EffectQuality = 'off' | 'low' | 'medium' | 'high';
export const EFFECT_QUALITIES: readonly EffectQuality[] = ['off', 'low', 'medium', 'high'];

// Cloud quality never fully turns off (clouds are core to the flight pillar) — low is its floor.
export type CloudQuality = 'low' | 'medium' | 'high';
export const CLOUD_QUALITIES: readonly CloudQuality[] = ['low', 'medium', 'high'];

export type TransformEffectQuality = 'low' | 'medium' | 'high';

export interface QualityPreset {
  id: string;
  label: string;

  /** Which renderer preset (renderSettings.ts) this tier maps to — keeps the Canvas single-sourced. */
  renderLevel: QualityLevel;

  shadowsEnabled: boolean;
  shadowMapSize: number;

  postprocessingEnabled: boolean;
  bloomEnabled: boolean;
  colorGradingEnabled: boolean;

  particleQuality: EffectQuality;
  weatherQuality: EffectQuality;
  cloudQuality: CloudQuality;
  transformationEffectQuality: TransformEffectQuality;

  // Integrates with Batch-8 MultiCharacterLimitConfig (written through editorSupportStore).
  maxActiveCharacters: number;
  maxStandbyCharacters: number;
  aiTickRateActive: number;
  aiTickRateStandby: number;

  objectPoolBudgetMultiplier: number;

  dynamicFovEnabled: boolean;
  cameraShakeEnabled: boolean;
  speedLinesEnabled: boolean;
  airDistortionEnabled: boolean;

  targetFps?: number;
}

export const VALID_SHADOW_MAP_SIZES: readonly number[] = [256, 512, 1024, 2048, 4096];

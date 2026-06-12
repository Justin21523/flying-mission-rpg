import { z } from 'zod';
import { VALID_SHADOW_MAP_SIZES, type QualityPreset } from '../../types/game/quality';

// Batch 12 — zod validation for authored quality presets. Invalid presets surface an error in the editor
// tab; at runtime the resolver falls back to a known-good seed preset so the game never crashes.

const effectQuality = z.enum(['off', 'low', 'medium', 'high']);
const cloudQuality = z.enum(['low', 'medium', 'high']);
const transformQuality = z.enum(['low', 'medium', 'high']);

export const QualityPresetSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  renderLevel: z.enum(['low', 'medium', 'high']),
  shadowsEnabled: z.boolean(),
  shadowMapSize: z.number().refine((n) => VALID_SHADOW_MAP_SIZES.includes(n), 'shadowMapSize must be a power-of-two map size'),
  postprocessingEnabled: z.boolean(),
  bloomEnabled: z.boolean(),
  colorGradingEnabled: z.boolean(),
  particleQuality: effectQuality,
  weatherQuality: effectQuality,
  cloudQuality,
  transformationEffectQuality: transformQuality,
  maxActiveCharacters: z.number().int().min(1),
  maxStandbyCharacters: z.number().int().min(0),
  aiTickRateActive: z.number().positive(),
  aiTickRateStandby: z.number().positive(),
  objectPoolBudgetMultiplier: z.number().positive(),
  dynamicFovEnabled: z.boolean(),
  cameraShakeEnabled: z.boolean(),
  speedLinesEnabled: z.boolean(),
  airDistortionEnabled: z.boolean(),
  targetFps: z.number().positive().optional(),
});

export interface QualityValidation {
  ok: boolean;
  errors: string[];
}

export function validateQualityPreset(preset: QualityPreset): QualityValidation {
  const res = QualityPresetSchema.safeParse(preset);
  if (res.success) return { ok: true, errors: [] };
  return { ok: false, errors: res.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`) };
}

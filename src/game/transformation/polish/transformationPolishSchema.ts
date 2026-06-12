import { z } from 'zod';
import type { TransformationPolishPreset } from '../../../types/game/transformationPolish';

// Batch 12 — zod validation for authored transformation polish presets. Invalid → editor error; runtime
// falls back to the character's color + a default style.
export const TransformationPolishSchema = z.object({
  id: z.string().min(1),
  characterId: z.string().min(1),
  themeColor: z.string().min(1),
  secondaryColor: z.string().min(1).optional(),
  particleStyle: z.enum(['speed', 'rescue', 'engineer', 'scout', 'water', 'space']),
  energyRingColor: z.string().min(1),
  backdropPulseIntensity: z.number().min(0).max(2),
  quickModePolishLevel: z.enum(['minimal', 'standard', 'flashy']),
});

export interface TransformationPolishValidation {
  ok: boolean;
  errors: string[];
}

export function validateTransformationPolish(preset: TransformationPolishPreset): TransformationPolishValidation {
  const res = TransformationPolishSchema.safeParse(preset);
  if (res.success) return { ok: true, errors: [] };
  return { ok: false, errors: res.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`) };
}

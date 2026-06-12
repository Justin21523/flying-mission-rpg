import { z } from 'zod';
import type { FlightPolishPreset } from '../../../types/game/flightPolish';

// Batch 12 — zod validation for authored flight polish presets. Invalid → editor shows an error and the
// runtime falls back to the seed sunny preset.
export const FlightPolishSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  speedLine: z.object({
    color: z.string().min(1),
    minSpeedForLines: z.number().min(0),
    maxIntensitySpeed: z.number().min(0),
    lineCount: z.number().int().min(0),
    lineLength: z.number().min(0),
    opacity: z.number().min(0).max(1),
    radialSpread: z.number().min(0),
    boostMultiplier: z.number().min(0),
  }),
  engineTrail: z.object({ color: z.string().min(1), length: z.number().min(0) }),
  cloudBreak: z.object({ particleCount: z.number().int().min(0), burstScale: z.number().min(0) }),
  weatherTransitionSpeed: z.number().min(0),
  colorGradeTint: z.string().min(1),
  cloudDensityMultiplier: z.number().min(0),
  landmarkVisibilityDistance: z.number().positive(),
});

export interface FlightPolishValidation {
  ok: boolean;
  errors: string[];
}

export function validateFlightPolish(preset: FlightPolishPreset): FlightPolishValidation {
  const res = FlightPolishSchema.safeParse(preset);
  if (res.success) return { ok: true, errors: [] };
  return { ok: false, errors: res.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`) };
}

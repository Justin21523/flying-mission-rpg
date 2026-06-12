import { z } from 'zod';
import { AUDIO_BUS_IDS, type AudioPreset } from '../../types/audioTypes';

// Batch 12 — zod validation for authored audio presets. Asset ids may be placeholders (absent → synth
// fallback), so they are not required; the validator only guards the things that could break playback.

const busId = z.enum(AUDIO_BUS_IDS as unknown as [string, ...string[]]);

export const AudioCueSchema = z.object({
  id: z.string().min(1),
  bus: busId,
  assetId: z.string().optional(),
  volume: z.number().min(0),
  pitchRange: z.tuple([z.number().positive(), z.number().positive()]).optional()
    .refine((r) => !r || r[0] <= r[1], 'pitchRange must be [min, max] with min <= max'),
  loop: z.boolean(),
  fallbackSfx: z.enum(['transform', 'ability', 'rescueSuccess', 'rescueFail', 'incident', 'questComplete', 'ui', 'pickup', 'ring', 'warn', 'land', 'objective', 'coin', 'blip', 'boost']).optional(),
});

export const AudioPresetSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  cues: z.array(AudioCueSchema),
});

export interface AudioValidation {
  ok: boolean;
  errors: string[];
}

export function validateAudioPreset(preset: AudioPreset): AudioValidation {
  const res = AudioPresetSchema.safeParse(preset);
  if (res.success) return { ok: true, errors: [] };
  return { ok: false, errors: res.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`) };
}

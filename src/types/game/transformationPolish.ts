// Batch 12 — per-character transformation polish. The transformation TIMELINE/effects/camera already
// exist and vary per character; this thin preset layers a coherent "look" (theme color, particle style,
// quick-mode polish level) resolved by the polish director, defaulting to the character's own color.

export type TransformationParticleStyle =
  | 'speed'      // high-speed thin lines, sharp bursts
  | 'rescue'     // soft halos, round particles
  | 'engineer'   // blocks / gears / tool feel
  | 'scout'      // radar sweep lines
  | 'water'      // droplets / ripples
  | 'space';     // star points / trails

export const TRANSFORMATION_PARTICLE_STYLES: readonly TransformationParticleStyle[] = ['speed', 'rescue', 'engineer', 'scout', 'water', 'space'];

export type QuickModePolishLevel = 'minimal' | 'standard' | 'flashy';
export const QUICK_MODE_POLISH_LEVELS: readonly QuickModePolishLevel[] = ['minimal', 'standard', 'flashy'];

export interface TransformationPolishPreset {
  id: string;
  characterId: string;
  themeColor: string;
  secondaryColor?: string;
  particleStyle: TransformationParticleStyle;
  energyRingColor: string;
  backdropPulseIntensity: number; // 0..2
  quickModePolishLevel: QuickModePolishLevel;
}

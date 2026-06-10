// The real-time vehicle⇄robot transformation (a core pillar). Three playback modes; a timeline of steps
// drives the staged camera/part reveal. Steps are a shell here — Batch 6 fills the full director.
export type TransformationMode = 'full' | 'interactive' | 'fast';
export const TRANSFORMATION_MODES: readonly TransformationMode[] = ['full', 'interactive', 'fast'];

export interface TransformationStep {
  id: string;
  label: string;
  atSec: number; // position on the timeline
}

export interface TransformationDefinition {
  id: string;
  nameZhTW: string;
  characterId?: string; // optional binding to one character
  durationSec: number;
  backdropColor: string; // hex
  particleColor: string; // hex
  steps: TransformationStep[];
}

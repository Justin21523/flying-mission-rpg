import { getAudioManager } from './AudioManager';
import { onAudioEvent } from './AudioEventBus';

// Batch 12 — fires transformation audio cues. The director emits 'transformation-stage' events as the
// timeline reaches key beats; this maps those beats to cues. Pure mapping is exported for testing; the
// installer subscribes the AudioEventBus so the director stays decoupled from the audio layer.

const STAGE_CUE: Record<string, string> = {
  start: 'transform.start',
  'enter-stage': 'transform.start',
  'part-transform': 'transform.unfold',
  'energy-ring': 'transform.ring',
  'white-flash': 'transform.flash',
  'model-swap': 'transform.swap',
  'finish-pose': 'transform.finish',
  finish: 'transform.finish',
  quick: 'transform.quick',
  'voice-cue': 'transform.voice',
};

export function cueForTransformationStage(stage: string): string | null {
  return STAGE_CUE[stage] ?? null;
}

export function playTransformationStage(stage: string): void {
  const cue = cueForTransformationStage(stage);
  if (cue) getAudioManager().play(cue);
}

/** Subscribe to transformation-stage audio events. Returns an unsubscribe cleanup. */
export function installTransformationAudio(): () => void {
  return onAudioEvent((e) => {
    if (e.type === 'transformation-stage') playTransformationStage(e.stage);
  });
}

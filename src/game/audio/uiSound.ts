import { playUiCue } from './UiAudioController';

// UI sound seam. Every screen/button calls this one interface; Batch 12 wires it to the AudioManager
// (which routes to a real file when present, else the WebAudio synth fallback). Never throws.
export type UiSoundKind = 'select' | 'confirm' | 'back' | 'hover' | 'launch';

export function playUiSound(kind: UiSoundKind): void {
  try {
    playUiCue(kind);
  } catch {
    /* audio must never break the UI */
  }
}

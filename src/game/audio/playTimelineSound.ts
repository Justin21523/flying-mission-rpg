import { getAudioManager } from './AudioManager';
import { playSfx, type SfxName } from './sfx';

// Play a timeline event's sound. Shared by every editable timeline (transformation effects, flight events, …)
// so the routing heuristic lives in ONE place: an id containing '.' is an audio cue id ('fx.boost') routed to
// the AudioManager (real asset → synth fallback); a bare id is a synth SfxName ('transform'). Both backends
// already self-gate on audioStore volumes/mute and are headless-safe (no AudioContext → silent no-op), so
// callers never need to gate.
export function playTimelineSound(soundId: string): void {
  if (!soundId) return;
  if (soundId.includes('.')) getAudioManager().play(soundId);
  else playSfx(soundId as SfxName);
}

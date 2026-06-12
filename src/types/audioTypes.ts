import type { SfxName } from '../game/audio/sfx';

// Batch 12 — audio data model. The AudioManager mixes through named buses; cues are data (asset id +
// bus + volume + pitch). Because the project ships NO audio files (content policy), every cue carries a
// `fallbackSfx` mapping to the existing WebAudio synth so the game has audible feedback and never
// hard-depends on a missing asset. Real `.mp3/.ogg` files can be dropped in later behind `assetId`.

export type AudioBusId = 'master' | 'music' | 'sfx' | 'ui' | 'voice' | 'ambient' | 'flight' | 'transformation';

export const AUDIO_BUS_IDS: readonly AudioBusId[] = ['master', 'music', 'sfx', 'ui', 'voice', 'ambient', 'flight', 'transformation'];

// Buses that pause when the scene is hidden / paused (loops & ambience); UI/voice/sfx stay responsive.
export const NON_ESSENTIAL_BUSES: readonly AudioBusId[] = ['music', 'ambient', 'flight', 'transformation'];

export interface AudioCueDef {
  id: string;
  bus: AudioBusId;
  /** Optional path/key to a real audio file. Absent → fallback synth. */
  assetId?: string;
  /** Per-cue gain (0..1) on top of the bus + master volume. */
  volume: number;
  /** Min/max playback-rate randomisation for variety (e.g. [0.95, 1.05]). */
  pitchRange?: [number, number];
  loop: boolean;
  /** Synth cue used when `assetId` is missing/unloadable — keeps audio working with no files. */
  fallbackSfx?: SfxName;
}

export interface AudioPreset {
  id: string;
  label: string;
  cues: AudioCueDef[];
}

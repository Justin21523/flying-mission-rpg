import type { AudioPreset } from '../../types/audioTypes';

// Batch 12 — placeholder audio presets. No `assetId`s (the project ships no audio files), so every cue
// falls back to the WebAudio synth via `fallbackSfx`. Drop real files in later and set `assetId` per cue
// to upgrade without touching call sites. Cue ids are the stable contract the controllers reference.

export const DEFAULT_UI_AUDIO: AudioPreset = {
  id: 'default-ui-audio',
  label: 'Default UI',
  cues: [
    { id: 'ui.click', bus: 'ui', volume: 0.6, loop: false, fallbackSfx: 'ui' },
    { id: 'ui.hover', bus: 'ui', volume: 0.3, loop: false, fallbackSfx: 'ui', pitchRange: [1.1, 1.2] },
    { id: 'ui.select', bus: 'ui', volume: 0.6, loop: false, fallbackSfx: 'ui' },
    { id: 'ui.back', bus: 'ui', volume: 0.5, loop: false, fallbackSfx: 'ui', pitchRange: [0.85, 0.9] },
    { id: 'ui.confirm', bus: 'ui', volume: 0.8, loop: false, fallbackSfx: 'questComplete' },
    { id: 'ui.launch', bus: 'ui', volume: 0.9, loop: false, fallbackSfx: 'ability' },
    { id: 'ui.missionComplete', bus: 'ui', volume: 0.9, loop: false, fallbackSfx: 'rescueSuccess' },
    { id: 'ui.supportArrived', bus: 'ui', volume: 0.7, loop: false, fallbackSfx: 'ability' },
  ],
};

export const DEFAULT_FLIGHT_AUDIO: AudioPreset = {
  id: 'default-flight-audio',
  label: 'Default Flight',
  cues: [
    { id: 'flight.engine', bus: 'flight', volume: 0.5, loop: true },
    { id: 'flight.wind', bus: 'flight', volume: 0.4, loop: true },
    { id: 'flight.boost', bus: 'flight', volume: 0.8, loop: false, fallbackSfx: 'ability' },
    { id: 'flight.cloudBreak', bus: 'flight', volume: 0.7, loop: false, fallbackSfx: 'ability', pitchRange: [0.9, 1.1] },
    { id: 'flight.crosswind', bus: 'flight', volume: 0.6, loop: false, fallbackSfx: 'incident' },
    { id: 'flight.weather', bus: 'ambient', volume: 0.5, loop: true },
  ],
};

export const STORM_FLIGHT_AUDIO: AudioPreset = {
  id: 'storm-flight-audio',
  label: 'Storm Flight',
  cues: [
    { id: 'flight.engine', bus: 'flight', volume: 0.5, loop: true },
    { id: 'flight.wind', bus: 'flight', volume: 0.7, loop: true },
    { id: 'flight.boost', bus: 'flight', volume: 0.8, loop: false, fallbackSfx: 'ability' },
    { id: 'flight.cloudBreak', bus: 'flight', volume: 0.8, loop: false, fallbackSfx: 'ability', pitchRange: [0.85, 1.05] },
    { id: 'flight.crosswind', bus: 'flight', volume: 0.8, loop: false, fallbackSfx: 'incident' },
    { id: 'flight.weather', bus: 'ambient', volume: 0.7, loop: true },
  ],
};

export const DEFAULT_TRANSFORMATION_AUDIO: AudioPreset = {
  id: 'default-transformation-audio',
  label: 'Default Transformation',
  cues: [
    { id: 'transform.start', bus: 'transformation', volume: 0.8, loop: false, fallbackSfx: 'transform' },
    { id: 'transform.unfold', bus: 'transformation', volume: 0.6, loop: false, fallbackSfx: 'ability' },
    { id: 'transform.ring', bus: 'transformation', volume: 0.7, loop: false, fallbackSfx: 'ability', pitchRange: [1.0, 1.15] },
    { id: 'transform.flash', bus: 'transformation', volume: 0.7, loop: false, fallbackSfx: 'ability' },
    { id: 'transform.swap', bus: 'transformation', volume: 0.7, loop: false, fallbackSfx: 'transform' },
    { id: 'transform.finish', bus: 'transformation', volume: 0.9, loop: false, fallbackSfx: 'rescueSuccess' },
    { id: 'transform.quick', bus: 'transformation', volume: 0.8, loop: false, fallbackSfx: 'transform' },
    { id: 'transform.voice', bus: 'voice', volume: 0.9, loop: false, fallbackSfx: 'questComplete' },
  ],
};

export const ALL_AUDIO_PRESETS: AudioPreset[] = [
  DEFAULT_UI_AUDIO,
  DEFAULT_FLIGHT_AUDIO,
  STORM_FLIGHT_AUDIO,
  DEFAULT_TRANSFORMATION_AUDIO,
];

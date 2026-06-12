// Batch 12.1 — procedural ambient beds. Filtered white-noise (wind/rain) + optional sparse chirps, generated
// by the engine (no audio files). The 🎵 Music tab edits enabled / volume.

export type AmbientLayerId = 'wind' | 'storm' | 'night' | 'city' | 'forest' | 'coast';

export type AmbientKind = 'wind' | 'rain';

export interface AmbientLayer {
  id: AmbientLayerId;
  label: string;
  enabled: boolean;
  volume: number;     // 0..1 base (master×ambient applied on top)
  kind: AmbientKind;  // base noise character
  filterHz: number;   // lowpass cutoff — lower = softer/duller
  chirpRate: number;  // average chirps per second (0 = none)
  chirpHz: number;    // centre frequency of chirps
}

export const AMBIENT_LAYERS: AmbientLayer[] = [
  { id: 'wind', label: 'Open Sky Wind', enabled: true, volume: 0.5, kind: 'wind', filterHz: 700, chirpRate: 0, chirpHz: 0 },
  { id: 'storm', label: 'Storm', enabled: true, volume: 0.7, kind: 'rain', filterHz: 1600, chirpRate: 0, chirpHz: 0 },
  { id: 'night', label: 'Night', enabled: true, volume: 0.4, kind: 'wind', filterHz: 400, chirpRate: 0.6, chirpHz: 2200 },
  { id: 'city', label: 'City Hum', enabled: true, volume: 0.45, kind: 'wind', filterHz: 500, chirpRate: 0.2, chirpHz: 900 },
  { id: 'forest', label: 'Forest', enabled: true, volume: 0.45, kind: 'wind', filterHz: 900, chirpRate: 1.2, chirpHz: 2600 },
  { id: 'coast', label: 'Coast', enabled: true, volume: 0.5, kind: 'rain', filterHz: 600, chirpRate: 0.5, chirpHz: 2000 },
];

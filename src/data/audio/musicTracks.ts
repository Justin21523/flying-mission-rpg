// Batch 12.1 — procedural BGM. Original, child-friendly, major-key loops described as data (no audio files).
// The engine (proceduralAudio.ts) schedules these per beat. The 🎵 Music tab edits tempo / volume / enabled.

export type MusicTrackId = 'menu' | 'hangar' | 'flight' | 'destination' | 'results' | 'pause';

export interface MusicTrack {
  id: MusicTrackId;
  label: string;
  enabled: boolean;
  volume: number;      // 0..1 base (master×music applied on top)
  tempo: number;       // BPM
  rootHz: number;      // frequency of semitone 0
  beatsPerBar: number;
  /** semitone per beat (relative to rootHz), -1 = rest. Length defines the loop. */
  bass: number[];
  melody: number[];
  /** chord root semitone per BAR; the engine plays a soft major triad sustained across the bar. */
  chords: number[];
}

const A3 = 220; // semitone 0 reference

// A gentle 4/4, 4-bar shape reused with different keys/tempos/motifs so each phase feels distinct but cohesive.
function track(id: MusicTrackId, label: string, tempo: number, rootHz: number, motif: number[], chords: number[], volume = 0.8): MusicTrack {
  const beatsPerBar = 4;
  const bars = chords.length;
  const beats = bars * beatsPerBar;
  const bass: number[] = [];
  for (let bar = 0; bar < bars; bar += 1) {
    const root = chords[bar];
    // root on 1, fifth on 3 — simple, warm.
    bass.push(root - 12, -1, root - 12 + 7, -1);
  }
  // Melody = the motif tiled/trimmed to the loop length.
  const melody: number[] = [];
  for (let i = 0; i < beats; i += 1) melody.push(motif[i % motif.length]);
  return { id, label, enabled: true, volume, tempo, rootHz, beatsPerBar, bass, melody, chords };
}

// Major-scale degrees as semitones: 0 2 4 5 7 9 11 12.
export const MUSIC_TRACKS: MusicTrack[] = [
  // Calm, welcoming console theme.
  track('menu', 'Menu', 84, A3, [0, 4, 7, 4, 5, 4, 2, -1], [0, 5, 7, 5]),
  // Busy, purposeful hangar prep.
  track('hangar', 'Hangar', 104, A3, [0, 7, 4, 7, 9, 7, 5, 4], [0, -3, 5, 7]),
  // Bright, soaring flight loop (a touch faster).
  track('flight', 'Flight', 120, A3 * 1.122, [7, 9, 11, 12, 9, 7, 4, 7], [0, 5, 9, 7], 0.7),
  // Friendly, settled destination groove.
  track('destination', 'Destination', 96, A3, [4, 2, 0, 2, 4, 5, 7, -1], [0, 5, 2, 7]),
  // Triumphant results fanfare.
  track('results', 'Results', 112, A3 * 1.122, [12, 11, 9, 7, 9, 11, 12, -1], [0, 7, 5, 7], 0.85),
  // Soft, suspended pause pad.
  track('pause', 'Pause', 60, A3, [0, -1, 4, -1, 7, -1, 4, -1], [0, 5], 0.5),
];

export const DEFAULT_MUSIC_TRACK: MusicTrackId = 'menu';

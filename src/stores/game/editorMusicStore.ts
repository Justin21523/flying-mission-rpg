import { createEditorCollection } from './createEditorCollection';
import type { MusicTrack } from '../../data/audio/musicTracks';
import type { AmbientLayer } from '../../data/audio/ambientLayers';
import { MUSIC_TRACKS } from '../../data/audio/musicTracks';
import { AMBIENT_LAYERS } from '../../data/audio/ambientLayers';

// Batch 12.1 — authored procedural-audio params (🎵 Music tab). Note PATTERNS are code-defined in the data
// modules; the editor tunes per-track tempo/volume/enabled and per-ambient volume/enabled. The procedural
// engine reads the effective values from here (falling back to the seed by id).
export const useEditorMusicTrackStore = createEditorCollection<MusicTrack>({
  storageKey: 'aero-rescue-editor-music-v1',
  seed: MUSIC_TRACKS,
  makeId: () => `music_${Date.now().toString(36)}`,
});

export const useEditorAmbientStore = createEditorCollection<AmbientLayer>({
  storageKey: 'aero-rescue-editor-ambient-v1',
  seed: AMBIENT_LAYERS,
  makeId: () => `ambient_${Date.now().toString(36)}`,
});

export function getEditorMusicTracks(): MusicTrack[] {
  return useEditorMusicTrackStore.getState().items;
}
export function getEditorMusicTrack(id: string): MusicTrack | undefined {
  return useEditorMusicTrackStore.getState().items.find((t) => t.id === id);
}
export function getEditorAmbientLayers(): AmbientLayer[] {
  return useEditorAmbientStore.getState().items;
}
export function getEditorAmbientLayer(id: string): AmbientLayer | undefined {
  return useEditorAmbientStore.getState().items.find((a) => a.id === id);
}

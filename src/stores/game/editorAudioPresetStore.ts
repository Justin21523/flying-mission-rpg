import { createEditorCollection } from './createEditorCollection';
import type { AudioPreset } from '../../types/audioTypes';
import { ALL_AUDIO_PRESETS } from '../../data/audio/audioPresets';

// Batch 12 — authored audio presets (🔊 Audio tab). Seeded from the placeholder presets; a designer can
// re-tune cue volumes / pitch / bus assignment. The audio runtime registers these into the AudioManager.
export const useEditorAudioPresetStore = createEditorCollection<AudioPreset>({
  storageKey: 'aero-rescue-editor-audio-v1',
  seed: ALL_AUDIO_PRESETS,
  makeId: () => `audio_${Date.now().toString(36)}`,
});

export function getEditorAudioPresets(): AudioPreset[] {
  return useEditorAudioPresetStore.getState().items;
}

export function getEditorAudioPreset(id: string): AudioPreset | undefined {
  return useEditorAudioPresetStore.getState().items.find((p) => p.id === id);
}

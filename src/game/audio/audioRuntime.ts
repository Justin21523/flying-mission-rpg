import { getAudioManager } from './AudioManager';
import { installUiAudio } from './UiAudioController';
import { installTransformationAudio } from './TransformationAudioController';
import { installMusicDirector } from './MusicDirector';
import { installAudioObservers } from './audioObservers';
import { installUiSoundDelegate } from './installUiSoundDelegate';
import { ALL_AUDIO_PRESETS } from '../../data/audio/audioPresets';
import { getEditorAudioPresets } from '../../stores/game/editorAudioPresetStore';

// Batch 12 / 12.1 — one-time audio bootstrap. Registers the authored audio presets (editor store → seed
// fallback) and installs every decoupled audio listener: UI cues, transformation cues, procedural BGM/
// ambient director, gameplay observers, and the global UI sound delegate. Mounted once from App; returns a
// cleanup so HMR / unmount tears it all down.

let installed = false;

export function initAudioRuntime(): () => void {
  const mgr = getAudioManager();
  const authored = getEditorAudioPresets();
  const presets = authored.length > 0 ? authored : ALL_AUDIO_PRESETS;
  for (const preset of presets) mgr.registerPreset(preset);
  // Always register the seed cue ids too, so any cue referenced by a controller resolves even if an
  // authored preset omitted it (authored presets override by id).
  for (const preset of ALL_AUDIO_PRESETS) mgr.registerPreset(preset);
  for (const preset of authored) mgr.registerPreset(preset);

  if (installed) return () => {};
  installed = true;
  const offUi = installUiAudio();
  const offXf = installTransformationAudio();
  const offMusic = installMusicDirector();
  const offObservers = installAudioObservers();
  const offDelegate = installUiSoundDelegate();
  return () => {
    offUi();
    offXf();
    offMusic();
    offObservers();
    offDelegate();
    installed = false;
  };
}

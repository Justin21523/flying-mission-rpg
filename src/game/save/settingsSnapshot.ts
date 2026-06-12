import type { SaveSettingsSnapshot } from '../../types/game/save';
import type { QualityTier, QualityPreset } from '../../types/game/quality';
import type { TransformationMode } from '../../types/game/transformation';
import type { FlightMode } from '../../types/game/flightControl';
import { useGraphicsSettingsStore } from '../../stores/graphicsSettingsStore';
import { useAudioStore } from '../../stores/audioStore';
import { useFlightRuntimeStore } from '../../stores/game/flightRuntimeStore';
import { useSettingsStore } from '../../stores/game/useSettingsStore';

// Batch 13 — one-way bridge between the live settings stores (the source of truth) and the save snapshot.
// capture: stores → snapshot (on settings change / save). apply: snapshot → stores (on load / import).
// No bidirectional subscription, so there's no update loop.

export function captureSettingsSnapshot(): SaveSettingsSnapshot {
  const g = useGraphicsSettingsStore.getState();
  const a = useAudioStore.getState();
  const f = useFlightRuntimeStore.getState();
  const s = useSettingsStore.getState().settings;
  return {
    qualityTier: g.tier,
    graphicsCustom: { ...g.customPreset },
    audio: {
      masterVolume: a.masterVolume, musicVolume: a.musicVolume, sfxVolume: a.sfxVolume,
      voiceVolume: a.voiceVolume, ambientVolume: a.ambientVolume, muteAll: a.muteAll, reduceLoud: a.reduceLoud,
    },
    gameplay: { flightMode: f.mode, transformMode: s.transformMode },
    accessibility: { reduceMotion: a.reduceMotion, highContrast: a.highContrast, textScale: a.textScale },
  };
}

export function applySettingsSnapshot(snap: SaveSettingsSnapshot): void {
  const g = useGraphicsSettingsStore.getState();
  if (snap.qualityTier === 'custom') g.setCustomPreset(snap.graphicsCustom as Partial<QualityPreset>);
  else g.setTier(snap.qualityTier as QualityTier);

  // Audio + accessibility apply in one merge (audioStore.importState accepts these fields).
  useAudioStore.getState().importState({
    masterVolume: snap.audio.masterVolume,
    musicVolume: snap.audio.musicVolume,
    sfxVolume: snap.audio.sfxVolume,
    voiceVolume: snap.audio.voiceVolume,
    ambientVolume: snap.audio.ambientVolume,
    muteAll: snap.audio.muteAll,
    reduceLoud: snap.audio.reduceLoud,
    reduceMotion: snap.accessibility.reduceMotion,
    highContrast: snap.accessibility.highContrast,
    textScale: snap.accessibility.textScale,
  });

  useFlightRuntimeStore.getState().setMode(snap.gameplay.flightMode as FlightMode);
  useSettingsStore.getState().update({ transformMode: snap.gameplay.transformMode as TransformationMode });
}

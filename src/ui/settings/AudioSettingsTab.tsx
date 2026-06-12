import { useAudioStore } from '../../stores/audioStore';
import { Toggle, Slider } from './settingsShared';

// Batch 12 — Audio settings. Five user-facing volumes drive the AudioManager buses; mute-all + reduce-loud
// are accessibility-friendly. All persisted in audioStore (single source).
export const AudioSettingsTab = () => {
  const s = useAudioStore();
  return (
    <div className="space-y-1 text-xs">
      <Slider label="Master volume" value={s.masterVolume} min={0} max={1} step={0.05} onChange={s.setMasterVolume} />
      <Slider label="Music volume" value={s.musicVolume} min={0} max={1} step={0.05} onChange={s.setMusicVolume} />
      <Slider label="SFX volume" value={s.sfxVolume} min={0} max={1} step={0.05} onChange={s.setSfxVolume} />
      <Slider label="Voice volume" value={s.voiceVolume} min={0} max={1} step={0.05} onChange={s.setVoiceVolume} />
      <Slider label="Ambient volume" value={s.ambientVolume} min={0} max={1} step={0.05} onChange={s.setAmbientVolume} />
      <div className="mt-1 border-t border-slate-700/60 pt-1" />
      <Toggle label="Mute all" checked={s.muteAll} onChange={() => s.toggleMuteAll()} />
      <Toggle label="SFX enabled" checked={s.sfxEnabled} onChange={() => s.toggleSfx()} />
      <Toggle label="Reduce loud effects" checked={s.reduceLoud} onChange={() => s.toggleReduceLoud()} />
    </div>
  );
};

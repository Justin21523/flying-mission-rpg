import { inp, lbl, Field } from '../editorShared';
import { useEditorAudioPresetStore } from '../../../stores/game/editorAudioPresetStore';
import { validateAudioPreset } from '../../../game/audio/audioPresetSchema';
import { getAudioManager } from '../../../game/audio/AudioManager';
import { AUDIO_BUS_IDS, type AudioBusId, type AudioCueDef, type AudioPreset } from '../../../types/audioTypes';

// Batch 12 — 🔊 Audio editor. Tunes cue volume / bus / loop per preset. Asset ids may be placeholders
// (synth fallback). A ▶ button previews a cue through the AudioManager.
export const AudioPresetEditorTab = () => {
  const items = useEditorAudioPresetStore((s) => s.items);
  const update = useEditorAudioPresetStore.getState().update;

  const patchCue = (preset: AudioPreset, cueId: string, patch: Partial<AudioCueDef>) => {
    update(preset.id, { cues: preset.cues.map((c) => (c.id === cueId ? { ...c, ...patch } : c)) });
  };

  return (
    <div className="flex flex-col gap-3 p-1 text-xs text-slate-200">
      <div className="text-[11px] text-slate-400">No audio files ship — every cue falls back to the WebAudio synth. Drop files in later and set an asset id per cue.</div>
      {items.map((preset) => {
        const v = validateAudioPreset(preset);
        return (
          <div key={preset.id} className="rounded border border-slate-700 bg-slate-900/60 p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-bold text-slate-100">{preset.label} <span className="text-slate-500">({preset.id})</span></span>
              {!v.ok && <span className="text-[10px] text-rose-400">⚠ {v.errors[0]}</span>}
            </div>
            <div className="flex flex-col gap-1">
              {preset.cues.map((c) => (
                <div key={c.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded bg-slate-950/40 p-1">
                  <span className="truncate text-[11px] text-slate-300">{c.id}</span>
                  <select className={`${inp} w-24`} value={c.bus} onChange={(e) => patchCue(preset, c.id, { bus: e.target.value as AudioBusId })}>
                    {AUDIO_BUS_IDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <input type="number" step={0.05} min={0} max={1} className={`${inp} w-16`} value={c.volume} onChange={(e) => patchCue(preset, c.id, { volume: Number(e.target.value) || 0 })} />
                  <button onClick={() => getAudioManager().play(c.id)} className="rounded bg-sky-700 px-2 py-0.5 text-[10px] text-white hover:bg-sky-600">▶</button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <Field label="(buses)"><div className={`${lbl} text-slate-500`}>master · music · sfx · ui · voice · ambient · flight · transformation</div></Field>
    </div>
  );
};

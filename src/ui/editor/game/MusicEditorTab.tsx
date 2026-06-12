import { inp, Field, Check } from '../editorShared';
import { useEditorMusicTrackStore, useEditorAmbientStore } from '../../../stores/game/editorMusicStore';
import { setTrack, setAmbient } from '../../../game/audio/proceduralAudio';
import type { MusicTrackId } from '../../../data/audio/musicTracks';
import type { AmbientLayerId } from '../../../data/audio/ambientLayers';

// Batch 12.1 — 🎵 Music editor. The note PATTERNS are code-defined; this tab tunes per-track tempo / volume /
// enabled and per-ambient volume / enabled, with a ▶ preview that drives the live procedural engine. Volumes
// here are multiplied by the Settings → Audio master/music/ambient sliders at playback.
export const MusicEditorTab = () => {
  const tracks = useEditorMusicTrackStore((s) => s.items);
  const ambients = useEditorAmbientStore((s) => s.items);
  const updateTrack = useEditorMusicTrackStore.getState().update;
  const updateAmbient = useEditorAmbientStore.getState().update;

  return (
    <div className="flex flex-col gap-3 p-1 text-xs text-slate-200">
      <div className="text-[11px] text-slate-400">Procedural BGM + ambient (no audio files). ▶ previews through the live engine; volumes scale by the Audio settings.</div>

      <div className="font-bold text-slate-100">Music tracks</div>
      {tracks.map((t) => (
        <div key={t.id} className="rounded border border-slate-700 bg-slate-900/60 p-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-semibold text-slate-100">{t.label} <span className="text-slate-500">({t.id})</span></span>
            <div className="flex gap-1">
              <button onClick={() => setTrack(t.id as MusicTrackId)} className="rounded bg-sky-700 px-2 py-0.5 text-[10px] text-white hover:bg-sky-600">▶</button>
              <button onClick={() => setTrack(null)} className="rounded bg-slate-700 px-2 py-0.5 text-[10px] text-white hover:bg-slate-600">■</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Volume"><input type="number" step={0.05} min={0} max={1} className={inp} value={t.volume} onChange={(e) => updateTrack(t.id, { volume: Number(e.target.value) || 0 })} /></Field>
            <Field label="Tempo (BPM)"><input type="number" step={2} min={30} max={220} className={inp} value={t.tempo} onChange={(e) => updateTrack(t.id, { tempo: Number(e.target.value) || 60 })} /></Field>
          </div>
          <Check label="Enabled" checked={t.enabled} onChange={(c) => updateTrack(t.id, { enabled: c })} />
        </div>
      ))}

      <div className="mt-1 font-bold text-slate-100">Ambient beds</div>
      {ambients.map((a) => (
        <div key={a.id} className="rounded border border-slate-700 bg-slate-900/60 p-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-semibold text-slate-100">{a.label} <span className="text-slate-500">({a.id})</span></span>
            <div className="flex gap-1">
              <button onClick={() => setAmbient(a.id as AmbientLayerId)} className="rounded bg-sky-700 px-2 py-0.5 text-[10px] text-white hover:bg-sky-600">▶</button>
              <button onClick={() => setAmbient(null)} className="rounded bg-slate-700 px-2 py-0.5 text-[10px] text-white hover:bg-slate-600">■</button>
            </div>
          </div>
          <Field label="Volume"><input type="number" step={0.05} min={0} max={1} className={inp} value={a.volume} onChange={(e) => updateAmbient(a.id, { volume: Number(e.target.value) || 0 })} /></Field>
          <Check label="Enabled" checked={a.enabled} onChange={(c) => updateAmbient(a.id, { enabled: c })} />
        </div>
      ))}
    </div>
  );
};

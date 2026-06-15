import { useState } from 'react';
import { useCinematicEffectStore } from '../../../stores/game/useCinematicEffectStore';
import { CINEMATIC_EFFECT_FAMILIES } from '../../../types/cinematicVfxTypes';
import type { CinematicEffectDefinition } from '../../../types/cinematicVfxTypes';
import { validateCinematicEffect } from '../../../game/vfx/CinematicVfxValidation';
import { getModelAsset } from '../../../data/modelLibrary';
import { previewVfx, cleanupAllVfx } from '../../../game/vfx/CinematicVfxDebugTools';
import { Field, inp, lbl } from '../editorShared';

// 🎬 Cinematic VFX — effect editor (Batch F.5). Edit an effect's family + total duration, inspect its layer
// stack, preview it, and see validation. Particle/fog/model layer details live in their dedicated tabs.
export const CinematicVfxEditorTab = () => {
  const items = useCinematicEffectStore((s) => s.items);
  const update = useCinematicEffectStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const [q, setQ] = useState('');
  const filtered = items.filter((e) => e.id.includes(q) || e.name.toLowerCase().includes(q.toLowerCase()));
  const e = items.find((x) => x.id === sel) as CinematicEffectDefinition | undefined;
  const modelExists = (id: string) => !!getModelAsset(id);

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center gap-2">
        <input placeholder="filter…" value={q} onChange={(ev) => setQ(ev.target.value)} className={inp + ' w-40'} />
        <button onClick={cleanupAllVfx} className="rounded bg-slate-700 px-2 py-1 text-[10px] text-white hover:bg-slate-600">Cleanup all VFX</button>
      </div>
      <div className="flex max-h-24 flex-wrap gap-1 overflow-auto">
        {filtered.slice(0, 60).map((x) => <button key={x.id} onClick={() => setSel(x.id)} className={`rounded px-2 py-0.5 text-[10px] ${x.id === sel ? 'bg-pink-600/30 text-pink-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{x.name}</button>)}
      </div>
      {e && (
        <>
          <div className={lbl}>🎬 {e.name} · {e.layers.length} layers</div>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
            <Field label="Family"><select value={e.effectFamily} onChange={(ev) => update(e.id, { effectFamily: ev.target.value as CinematicEffectDefinition['effectFamily'] })} className={inp}>{CINEMATIC_EFFECT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}</select></Field>
            <Field label="Total duration (s)"><input type="number" step={0.1} value={e.timeline.totalDurationSeconds} onChange={(ev) => update(e.id, { timeline: { ...e.timeline, totalDurationSeconds: parseFloat(ev.target.value) || 0.1 } })} className={inp} /></Field>
            <Field label="Preview"><button onClick={() => previewVfx(e.id)} className="rounded bg-sky-700 px-2 py-1 text-[10px] text-white hover:bg-sky-600">▶ Preview effect</button></Field>
          </div>
          <div className="rounded-lg border border-slate-800 p-2 text-[10px] text-slate-400">
            {e.layers.map((l) => <div key={l.id}>· {l.layerType} → {l.v2EffectType} @ {l.startTimeSeconds}s ({l.durationSeconds}s){l.model?.modelAssetId ? ` · ${l.model.modelAssetId}` : ''}</div>)}
          </div>
          <div className="text-[10px]">
            {validateCinematicEffect(e, modelExists).errors.map((m, i) => <div key={i} className="text-rose-400">✗ {m}</div>)}
            {validateCinematicEffect(e, modelExists).warnings.map((m, i) => <div key={i} className="text-amber-400">⚠ {m}</div>)}
            {validateCinematicEffect(e, modelExists).ok && <div className="text-emerald-400">✓ effect valid</div>}
          </div>
        </>
      )}
    </div>
  );
};

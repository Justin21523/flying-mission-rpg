import { useState } from 'react';
import { useCinematicEffectStore } from '../../../stores/game/useCinematicEffectStore';
import { Field, inp, lbl } from '../editorShared';

// 🎬 Particle layer editor (Batch F.5) — tune the particle layers of a selected cinematic effect.
export const ParticleLayerEditorTab = () => {
  const items = useCinematicEffectStore((s) => s.items);
  const update = useCinematicEffectStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items.find((e) => e.layers.some((l) => l.particle))?.id ?? null);
  const e = items.find((x) => x.id === sel);
  const setLayer = (i: number, patch: Partial<NonNullable<(typeof items)[number]['layers'][number]['particle']>>) => {
    if (!e) return;
    const layers = e.layers.map((l, j) => (j === i && l.particle ? { ...l, particle: { ...l.particle, ...patch } } : l));
    update(e.id, { layers });
  };
  return (
    <div className="space-y-3 text-xs">
      <select value={sel ?? ''} onChange={(ev) => setSel(ev.target.value)} className={inp + ' w-64'}>
        {items.filter((x) => x.layers.some((l) => l.particle)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
      </select>
      {e?.layers.map((l, i) => l.particle && (
        <div key={l.id} className="rounded-lg border border-slate-800 p-2">
          <div className={lbl}>{l.layerType} · {l.v2EffectType}</div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Count"><input type="number" value={l.particle.count} onChange={(ev) => setLayer(i, { count: parseInt(ev.target.value) || 0 })} className={inp} /></Field>
            <Field label="Opacity start"><input type="number" step={0.1} value={l.particle.opacityStart ?? 1} onChange={(ev) => setLayer(i, { opacityStart: parseFloat(ev.target.value) || 0 })} className={inp} /></Field>
            <Field label="Color"><input type="color" value={l.particle.colorStart ?? '#ffffff'} onChange={(ev) => setLayer(i, { colorStart: ev.target.value })} className="h-7 w-16 rounded bg-slate-800" /></Field>
          </div>
        </div>
      ))}
    </div>
  );
};

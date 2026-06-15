import { useState } from 'react';
import { useCinematicEffectStore } from '../../../stores/game/useCinematicEffectStore';
import { Field, inp, lbl } from '../editorShared';

// 🎬 Fog / cloud layer editor (Batch F.5).
export const FogCloudLayerEditorTab = () => {
  const items = useCinematicEffectStore((s) => s.items);
  const update = useCinematicEffectStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items.find((e) => e.layers.some((l) => l.fogCloud))?.id ?? null);
  const e = items.find((x) => x.id === sel);
  const setLayer = (i: number, patch: Partial<NonNullable<(typeof items)[number]['layers'][number]['fogCloud']>>) => {
    if (!e) return;
    update(e.id, { layers: e.layers.map((l, j) => (j === i && l.fogCloud ? { ...l, fogCloud: { ...l.fogCloud, ...patch } } : l)) });
  };
  return (
    <div className="space-y-3 text-xs">
      <select value={sel ?? ''} onChange={(ev) => setSel(ev.target.value)} className={inp + ' w-64'}>
        {items.filter((x) => x.layers.some((l) => l.fogCloud)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
      </select>
      {e?.layers.map((l, i) => l.fogCloud && (
        <div key={l.id} className="rounded-lg border border-slate-800 p-2">
          <div className={lbl}>{l.layerType}</div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Puff count"><input type="number" value={l.fogCloud.puffCount} onChange={(ev) => setLayer(i, { puffCount: parseInt(ev.target.value) || 0 })} className={inp} /></Field>
            <Field label="Expansion speed"><input type="number" step={0.5} value={l.fogCloud.expansionSpeed} onChange={(ev) => setLayer(i, { expansionSpeed: parseFloat(ev.target.value) || 0 })} className={inp} /></Field>
            <Field label="Color"><input type="color" value={l.fogCloud.color ?? '#ffffff'} onChange={(ev) => setLayer(i, { color: ev.target.value })} className="h-7 w-16 rounded bg-slate-800" /></Field>
          </div>
        </div>
      ))}
    </div>
  );
};

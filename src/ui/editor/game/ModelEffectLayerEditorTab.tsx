import { useState } from 'react';
import { useCinematicEffectStore } from '../../../stores/game/useCinematicEffectStore';
import { getModelAsset } from '../../../data/modelLibrary';
import { Field, inp, lbl } from '../editorShared';

// 🎬 Model / object-assembly layer editor (Batch F.5).
export const ModelEffectLayerEditorTab = () => {
  const items = useCinematicEffectStore((s) => s.items);
  const update = useCinematicEffectStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items.find((e) => e.layers.some((l) => l.model))?.id ?? null);
  const e = items.find((x) => x.id === sel);
  const setLayer = (i: number, patch: Partial<NonNullable<(typeof items)[number]['layers'][number]['model']>>) => {
    if (!e) return;
    update(e.id, { layers: e.layers.map((l, j) => (j === i && l.model ? { ...l, model: { ...l.model, ...patch } } : l)) });
  };
  return (
    <div className="space-y-3 text-xs">
      <select value={sel ?? ''} onChange={(ev) => setSel(ev.target.value)} className={inp + ' w-64'}>
        {items.filter((x) => x.layers.some((l) => l.model)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
      </select>
      {e?.layers.map((l, i) => l.model && (
        <div key={l.id} className="rounded-lg border border-slate-800 p-2">
          <div className={lbl}>{l.layerType} · {l.model.shape}{l.model.modelAssetId && !getModelAsset(l.model.modelAssetId) ? ' ⚠ missing → fallback' : ''}</div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Model asset id"><input value={l.model.modelAssetId ?? ''} onChange={(ev) => setLayer(i, { modelAssetId: ev.target.value || undefined })} className={inp} /></Field>
            <Field label="Count"><input type="number" value={l.model.count} onChange={(ev) => setLayer(i, { count: parseInt(ev.target.value) || 1 })} className={inp} /></Field>
            <Field label="Scale"><input type="number" step={0.1} value={l.model.scale} onChange={(ev) => setLayer(i, { scale: parseFloat(ev.target.value) || 1 })} className={inp} /></Field>
          </div>
        </div>
      ))}
    </div>
  );
};

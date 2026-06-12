import { nanoid } from 'nanoid';
import { ANIM_TRIGGERS } from '../../../types/character';
import type { AnimRule } from '../../../types/character';
import { Check, lbl, MoveButtons } from '../editorShared';
import { moveItem } from '../../../game/editor/arrayMove';
import { TextRow, NumRow, SelectRow } from './CollectionEditor';
import { AnimationTrackSelect } from '../AnimationTrackSelect';

// Clip dropdown that reads the model's real GLB clip names. Unknown saved values stay selectable.
export const ClipSelectField = ({ label, modelAssetId, value, onChange }: { label: string; modelAssetId?: string; value: string; onChange: (v: string) => void }) => {
  return <AnimationTrackSelect label={label} modelAssetId={modelAssetId} value={value} onChange={(v) => onChange(v ?? '')} />;
};

// Animation Rules sub-editor — reuse the POLI AnimRule engine (animRunner.pickLoopRule): each rule maps a
// game trigger (idle/moving/flying/vehicle/robot/ability/celebrate/key) to a model clip with priority/speed
// gates, so authors define exactly which animation plays when. Used by Characters AND game NPCs.
export const AnimationRulesEditor = ({ rules, modelAssetId, onChange }: { rules: AnimRule[]; modelAssetId?: string; onChange: (r: AnimRule[]) => void }) => {
  const add = () => onChange([...rules, { id: `ar_${nanoid(5)}`, clip: '', trigger: 'idle', priority: 0, loop: true }]);
  const patch = (id: string, p: Partial<AnimRule>) => onChange(rules.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const dup = (id: string) => { const r = rules.find((x) => x.id === id); if (r) onChange([...rules, { ...r, id: `ar_${nanoid(5)}` }]); };
  const remove = (id: string) => onChange(rules.filter((r) => r.id !== id));
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className={lbl}>Animation rules · {rules.length}</div>
        <button onClick={add} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Rule</button>
      </div>
      <p className="mt-0.5 text-[10px] text-slate-500">Highest-priority matching rule plays. Triggers: idle/moving/flying/vehicle/robot/ability/celebrate/key. Empty list = use the single clips/default.</p>
      <div className="mt-1 space-y-1.5">
        {rules.map((r, i) => (
          <div key={r.id} className="rounded bg-slate-900/60 p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <TextRow label="Label" value={r.name ?? ''} onChange={(v) => patch(r.id, { name: v || undefined })} />
              <SelectRow label="Trigger" value={r.trigger} options={ANIM_TRIGGERS.map((t) => ({ value: t, label: t }))} onChange={(v) => patch(r.id, { trigger: v as AnimRule['trigger'] })} />
            </div>
            <ClipSelectField label="Clip" modelAssetId={modelAssetId} value={r.clip} onChange={(v) => patch(r.id, { clip: v })} />
            <div className="grid grid-cols-3 gap-1.5">
              <NumRow label="Priority" value={r.priority ?? 0} step={1} onChange={(v) => patch(r.id, { priority: v })} />
              <NumRow label="Speed min" value={r.speedMin ?? 0} step={0.5} min={0} onChange={(v) => patch(r.id, { speedMin: v || undefined })} />
              <NumRow label="Speed max" value={r.speedMax ?? 0} step={0.5} min={0} onChange={(v) => patch(r.id, { speedMax: v || undefined })} />
            </div>
            {r.trigger === 'key' && <TextRow label="Key code (e.g. KeyV)" value={r.key ?? ''} onChange={(v) => patch(r.id, { key: v || undefined })} />}
            <div className="grid grid-cols-2 gap-1.5">
              <NumRow label="Crossfade (s)" value={r.crossfadeSec ?? 0.2} step={0.05} min={0} onChange={(v) => patch(r.id, { crossfadeSec: v })} />
              <div className="flex items-end gap-3 pb-1">
                <Check label="Loop" checked={r.loop ?? true} onChange={(v) => patch(r.id, { loop: v })} />
                <Check label="Once" checked={r.once ?? false} onChange={(v) => patch(r.id, { once: v })} />
              </div>
            </div>
            <div className="mt-1 flex gap-1.5">
              <MoveButtons index={i} count={rules.length} onMove={(d) => onChange(moveItem(rules, i, d))} />
              <button onClick={() => dup(r.id)} className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-700">⧉ Duplicate</button>
              <button onClick={() => remove(r.id)} className="rounded bg-rose-700/20 px-2 py-0.5 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Remove</button>
            </div>
          </div>
        ))}
        {rules.length === 0 && <div className="text-[11px] text-slate-500">No rules — the single fallback clips are used.</div>}
      </div>
    </div>
  );
};

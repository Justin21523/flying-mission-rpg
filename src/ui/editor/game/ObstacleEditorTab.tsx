import { useState } from 'react';
import { useEditorObstacleStore } from '../../../stores/game/editorObstacleStore';
import { OBSTACLE_TYPES, OBSTACLE_STATES } from '../../../types/game/obstacle';
import type { ObstacleType, ObstacleState } from '../../../types/game/obstacle';
import { validateObstacle } from '../../../game/obstacles/obstacleValidation';
import { Field, inp, lbl, Check, csv, parseCsv, FocusButton } from '../editorShared';

// 🧱 Obstacles — author Advanced Mission Zone obstacles (Energy Barrier / Cracked Wall / Corrupted Device).
// Form-based with a 3D focus button (marker via the obstacle's position); damageable obstacles edit hp +
// weakness/resistance; all edit type / segment / transform / states / linked condition.
const num = (v: string) => parseFloat(v) || 0;

export const ObstacleEditorTab = () => {
  const items = useEditorObstacleStore((s) => s.items);
  const update = useEditorObstacleStore((s) => s.update);
  const duplicate = useEditorObstacleStore((s) => s.duplicate);
  const remove = useEditorObstacleStore((s) => s.remove);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const o = items.find((x) => x.id === sel);
  const pos = o?.transform.position ?? [0, 0, 0];

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className={lbl}>Obstacles · {items.length}</div>
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((x) => (
          <button key={x.id} onClick={() => setSel(x.id)} className={`rounded px-2 py-1 text-[11px] ${x.id === sel ? 'bg-sky-600/30 text-sky-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{x.name}</button>
        ))}
      </div>
      {o && (
        <div className="space-y-2 rounded-lg border border-slate-800 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name"><input value={o.name} onChange={(e) => update(o.id, { name: e.target.value })} className={inp} /></Field>
            <Field label="Type"><select value={o.obstacleType} onChange={(e) => update(o.id, { obstacleType: e.target.value as ObstacleType })} className={inp}>{OBSTACLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Segment id"><input value={o.segmentId} onChange={(e) => update(o.id, { segmentId: e.target.value })} className={inp} /></Field>
            <Field label="Initial state"><select value={o.stateMachine.initialState} onChange={(e) => update(o.id, { stateMachine: { ...o.stateMachine, initialState: e.target.value as ObstacleState } })} className={inp}>{OBSTACLE_STATES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Linked condition id"><input value={o.linkedZoneConditionId ?? ''} onChange={(e) => update(o.id, { linkedZoneConditionId: e.target.value || undefined })} className={inp} /></Field>
          </div>
          <Field label="Position (x / y / z)">
            <div className="flex gap-1">
              {([0, 1, 2] as const).map((a) => (
                <input key={a} type="number" step={0.5} value={pos[a]} onChange={(e) => { const p = [...o.transform.position] as [number, number, number]; p[a] = num(e.target.value); update(o.id, { transform: { ...o.transform, position: p } }); }} className={inp + ' w-0 flex-1 text-center'} />
              ))}
              <FocusButton position={pos as [number, number, number]} />
            </div>
          </Field>
          {o.damageable && (
            <div className="grid grid-cols-2 gap-2 rounded border border-slate-800 p-1.5">
              <Field label="Max HP"><input type="number" value={o.damageable.maxHp} onChange={(e) => update(o.id, { damageable: { ...o.damageable!, maxHp: num(e.target.value) } })} className={inp} /></Field>
              <Field label="Max Shield"><input type="number" value={o.damageable.maxShield ?? 0} onChange={(e) => update(o.id, { damageable: { ...o.damageable!, maxShield: num(e.target.value) || undefined } })} className={inp} /></Field>
              <Field label="Weakness tags (csv)"><input value={csv(o.damageable.weaknessTags)} onChange={(e) => update(o.id, { damageable: { ...o.damageable!, weaknessTags: parseCsv(e.target.value) } })} className={inp} /></Field>
              <Field label="Resistance tags (csv)"><input value={csv(o.damageable.resistanceTags)} onChange={(e) => update(o.id, { damageable: { ...o.damageable!, resistanceTags: parseCsv(e.target.value) } })} className={inp} /></Field>
            </div>
          )}
          <div className="text-[10px] text-slate-400">Interaction rules: {o.interactionRules.map((r) => `${r.trigger}→${r.resultState}`).join(', ') || '(none)'}</div>
          <div className="text-[10px]">
            {validateObstacle(o).errors.map((e, i) => <div key={i} className="text-rose-400">✗ {e}</div>)}
            {validateObstacle(o).warnings.map((w, i) => <div key={i} className="text-amber-400">⚠ {w}</div>)}
            {validateObstacle(o).ok && validateObstacle(o).warnings.length === 0 && <div className="text-emerald-400">✓ valid</div>}
          </div>
          <Check label="Enabled" checked={o.enabled} onChange={(v) => update(o.id, { enabled: v })} />
          <div className="flex items-center gap-1.5 border-t border-slate-800/60 pt-2">
            <button onClick={() => { const id = duplicate(o.id); if (id) setSel(id); }} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">⧉ Duplicate</button>
            <button onClick={() => { remove(o.id); setSel(null); }} className="rounded bg-rose-700/20 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Delete</button>
            <span className="ml-auto self-center text-[10px] text-slate-500">id: {o.id}</span>
          </div>
        </div>
      )}
    </div>
  );
};

import { useState } from 'react';
import { useIncidentEditorStore } from '../../../stores/useIncidentEditorStore';
import type { IncidentObjectiveStep } from '../../../types/incidentTypes';
import { INCIDENT_OBJECTIVE_TYPES } from '../../../types/incidentTypes';
import { Field, Check, inp, lbl } from '../../editor/editorShared';

// 🚨 Incident objective editor (Batch G §14.4) — edits a template's default objective steps.
export const IncidentObjectiveEditorTab = () => {
  const items = useIncidentEditorStore((s) => s.items);
  const update = useIncidentEditorStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const t = items.find((x) => x.id === sel);
  const setObjectives = (objs: IncidentObjectiveStep[]) => t && update(t.id, { defaultObjectives: objs });
  const patchObj = (i: number, patch: Partial<IncidentObjectiveStep>) => t && setObjectives(t.defaultObjectives.map((o, j) => (j === i ? { ...o, ...patch } : o)));

  return (
    <div className="space-y-2 text-xs">
      <div className="flex flex-wrap gap-1">
        {items.map((x) => <button key={x.id} onClick={() => setSel(x.id)} className={`rounded px-2 py-1 text-[10px] ${x.id === sel ? 'bg-amber-600/30 text-amber-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{x.title}</button>)}
      </div>
      {t && (
        <>
          <div className={lbl}>Objectives — {t.title}</div>
          {t.defaultObjectives.map((o, i) => (
            <div key={o.id} className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
              <Field label="Label"><input value={o.label} onChange={(e) => patchObj(i, { label: e.target.value })} className={inp} /></Field>
              <Field label="Type"><select value={o.objectiveType} onChange={(e) => patchObj(i, { objectiveType: e.target.value as IncidentObjectiveStep['objectiveType'] })} className={inp}>{INCIDENT_OBJECTIVE_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}</select></Field>
              <Field label="Target id"><input value={o.targetId ?? ''} onChange={(e) => patchObj(i, { targetId: e.target.value || undefined })} className={inp} /></Field>
              <Field label="Order"><input type="number" value={o.order} onChange={(e) => patchObj(i, { order: parseInt(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="UI hint"><input value={o.uiHint ?? ''} onChange={(e) => patchObj(i, { uiHint: e.target.value || undefined })} className={inp} /></Field>
              <Check label="Optional" checked={o.optional} onChange={(v) => patchObj(i, { optional: v })} />
              <button onClick={() => setObjectives(t.defaultObjectives.filter((_, j) => j !== i))} className="col-span-2 rounded bg-rose-800 px-2 py-0.5 text-[10px] text-white hover:bg-rose-700">Remove</button>
            </div>
          ))}
          <button onClick={() => setObjectives([...t.defaultObjectives, { id: `obj_${Date.now().toString(36)}`, label: 'New objective', objectiveType: 'reach-area', completionConditions: [{ type: 'player-reached-area', areaId: 'area#main', radius: 8 }], optional: false, order: t.defaultObjectives.length + 1 }])} className="rounded bg-emerald-800 px-2 py-1 text-[11px] text-white hover:bg-emerald-700">+ Add objective</button>
        </>
      )}
    </div>
  );
};

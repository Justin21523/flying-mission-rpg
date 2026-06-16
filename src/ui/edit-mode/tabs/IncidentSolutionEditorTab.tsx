import { useState } from 'react';
import { useIncidentEditorStore } from '../../../stores/useIncidentEditorStore';
import type { IncidentSolutionDefinition } from '../../../types/incidentTypes';
import { INCIDENT_SOLUTION_TYPES } from '../../../types/incidentTypes';
import { Field, inp, lbl, csv, parseCsv } from '../../editor/editorShared';

// 🚨 Incident solution editor (Batch G §14.5) — edits a template's default solutions (≥2 so no single character
// is mandatory).
export const IncidentSolutionEditorTab = () => {
  const items = useIncidentEditorStore((s) => s.items);
  const update = useIncidentEditorStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const t = items.find((x) => x.id === sel);
  const setSolutions = (sols: IncidentSolutionDefinition[]) => t && update(t.id, { defaultSolutions: sols });
  const patch = (i: number, p: Partial<IncidentSolutionDefinition>) => t && setSolutions(t.defaultSolutions.map((s, j) => (j === i ? { ...s, ...p } : s)));

  return (
    <div className="space-y-2 text-xs">
      <div className="flex flex-wrap gap-1">
        {items.map((x) => <button key={x.id} onClick={() => setSel(x.id)} className={`rounded px-2 py-1 text-[10px] ${x.id === sel ? 'bg-amber-600/30 text-amber-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{x.title}</button>)}
      </div>
      {t && (
        <>
          <div className={lbl}>Solutions — {t.title} {t.defaultSolutions.length < 2 && <span className="text-rose-400">(needs ≥2)</span>}</div>
          {t.defaultSolutions.map((s, i) => (
            <div key={s.id} className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
              <Field label="Label"><input value={s.label} onChange={(e) => patch(i, { label: e.target.value })} className={inp} /></Field>
              <Field label="Type"><select value={s.solutionType} onChange={(e) => patch(i, { solutionType: e.target.value as IncidentSolutionDefinition['solutionType'] })} className={inp}>{INCIDENT_SOLUTION_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}</select></Field>
              <Field label="Roles (csv)"><input value={csv(s.requiredRoleTags)} onChange={(e) => patch(i, { requiredRoleTags: parseCsv(e.target.value) as IncidentSolutionDefinition['requiredRoleTags'] })} className={inp} /></Field>
              <Field label="Target ids (csv)"><input value={csv(s.targetIds)} onChange={(e) => patch(i, { targetIds: parseCsv(e.target.value) })} className={inp} /></Field>
              <Field label="Support types (csv)"><input value={csv(s.requiredSupportAbilityTypes)} onChange={(e) => patch(i, { requiredSupportAbilityTypes: parseCsv(e.target.value) })} className={inp} /></Field>
              <button onClick={() => setSolutions(t.defaultSolutions.filter((_, j) => j !== i))} className="rounded bg-rose-800 px-2 py-0.5 text-[10px] text-white hover:bg-rose-700">Remove</button>
            </div>
          ))}
          <button onClick={() => setSolutions([...t.defaultSolutions, { id: `sol_${Date.now().toString(36)}`, label: 'New solution', description: '', solutionType: 'manual-interaction', targetIds: [], expectedStateChanges: [] }])} className="rounded bg-emerald-800 px-2 py-1 text-[11px] text-white hover:bg-emerald-700">+ Add solution</button>
        </>
      )}
    </div>
  );
};

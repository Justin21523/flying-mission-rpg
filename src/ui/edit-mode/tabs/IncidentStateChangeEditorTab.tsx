import { useState } from 'react';
import { useIncidentEditorStore } from '../../../stores/useIncidentEditorStore';
import type { IncidentStateChange } from '../../../types/incidentTypes';
import { INCIDENT_TARGET_TYPES, INCIDENT_NPC_CHANGES, INCIDENT_OBJECT_CHANGES, INCIDENT_OBSTACLE_CHANGES, INCIDENT_ENVIRONMENT_CHANGES } from '../../../types/incidentTypes';
import { Field, inp, lbl } from '../../editor/editorShared';

// 🚨 Incident state-change editor (Batch G §14.3) — edits a template's default initial state changes.
const CHANGES_FOR: Record<IncidentStateChange['targetType'], readonly string[]> = {
  npc: INCIDENT_NPC_CHANGES, object: INCIDENT_OBJECT_CHANGES, obstacle: INCIDENT_OBSTACLE_CHANGES, environment: INCIDENT_ENVIRONMENT_CHANGES,
};

export const IncidentStateChangeEditorTab = () => {
  const items = useIncidentEditorStore((s) => s.items);
  const update = useIncidentEditorStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const t = items.find((x) => x.id === sel);
  const setChanges = (cs: IncidentStateChange[]) => t && update(t.id, { defaultInitialStateChanges: cs });
  const patch = (i: number, p: Partial<IncidentStateChange>) => t && setChanges(t.defaultInitialStateChanges.map((c, j) => (j === i ? ({ ...c, ...p } as IncidentStateChange) : c)));

  return (
    <div className="space-y-2 text-xs">
      <div className="flex flex-wrap gap-1">
        {items.map((x) => <button key={x.id} onClick={() => setSel(x.id)} className={`rounded px-2 py-1 text-[10px] ${x.id === sel ? 'bg-amber-600/30 text-amber-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{x.title}</button>)}
      </div>
      {t && (
        <>
          <div className={lbl}>Initial state changes — {t.title}</div>
          {t.defaultInitialStateChanges.map((c, i) => (
            <div key={c.id ?? i} className="grid grid-cols-3 gap-2 rounded-lg border border-slate-800 p-2">
              <Field label="Target type"><select value={c.targetType} onChange={(e) => patch(i, { targetType: e.target.value as IncidentStateChange['targetType'], change: CHANGES_FOR[e.target.value as IncidentStateChange['targetType']][0] } as Partial<IncidentStateChange>)} className={inp}>{INCIDENT_TARGET_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}</select></Field>
              <Field label="Target id"><input value={c.targetId} onChange={(e) => patch(i, { targetId: e.target.value })} className={inp} /></Field>
              <Field label="Change"><select value={c.change} onChange={(e) => patch(i, { change: e.target.value } as Partial<IncidentStateChange>)} className={inp}>{CHANGES_FOR[c.targetType].map((x) => <option key={x} value={x}>{x}</option>)}</select></Field>
              <button onClick={() => setChanges(t.defaultInitialStateChanges.filter((_, j) => j !== i))} className="col-span-3 rounded bg-rose-800 px-2 py-0.5 text-[10px] text-white hover:bg-rose-700">Remove</button>
            </div>
          ))}
          <button onClick={() => setChanges([...t.defaultInitialStateChanges, { id: `sc_${Date.now().toString(36)}`, targetType: 'npc', targetId: 'npc#0', change: 'set-trapped' }])} className="rounded bg-emerald-800 px-2 py-1 text-[11px] text-white hover:bg-emerald-700">+ Add state change</button>
        </>
      )}
    </div>
  );
};

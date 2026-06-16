import { useState } from 'react';
import { useIncidentEditorStore } from '../../../stores/useIncidentEditorStore';
import type { IncidentTemplate } from '../../../types/incidentTemplateTypes';
import { INCIDENT_TYPES } from '../../../types/incidentTypes';
import { Field, Check, inp, lbl, csv, parseCsv } from '../../editor/editorShared';

// 🚨 Incident Templates editor (Batch G §14.1).
export const IncidentTemplateEditorTab = () => {
  const items = useIncidentEditorStore((s) => s.items);
  const update = useIncidentEditorStore((s) => s.update);
  const duplicate = useIncidentEditorStore((s) => s.duplicate);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const t = items.find((x) => x.id === sel) as IncidentTemplate | undefined;
  const ai = (patch: Partial<IncidentTemplate['aiControlParameters']>) => t && update(t.id, { aiControlParameters: { ...t.aiControlParameters, ...patch } });

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap gap-1">
        {items.map((x) => <button key={x.id} onClick={() => setSel(x.id)} className={`rounded px-2 py-1 text-[10px] ${x.id === sel ? 'bg-amber-600/30 text-amber-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{x.title}</button>)}
      </div>
      {t && (
        <>
          <div className={lbl}>🚨 {t.title} · {t.incidentType}</div>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
            <Field label="Title"><input value={t.title} onChange={(e) => update(t.id, { title: e.target.value })} className={inp} /></Field>
            <Field label="Type"><select value={t.incidentType} onChange={(e) => update(t.id, { incidentType: e.target.value as IncidentTemplate['incidentType'] })} className={inp}>{INCIDENT_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}</select></Field>
            <Field label="Danger (1-5)"><input type="number" min={1} max={5} value={t.dangerLevel} onChange={(e) => update(t.id, { dangerLevel: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) as 1 | 2 | 3 | 4 | 5 })} className={inp} /></Field>
            <Field label="Time limit (s)"><input type="number" value={t.timeLimitSeconds ?? 0} onChange={(e) => update(t.id, { timeLimitSeconds: parseInt(e.target.value) || undefined })} className={inp} /></Field>
            <Field label="Recommended chars (csv)"><input value={csv(t.recommendedCharacterIds)} onChange={(e) => update(t.id, { recommendedCharacterIds: parseCsv(e.target.value) })} className={inp} /></Field>
            <Field label="Required roles (csv)"><input value={csv(t.requiredRescueRoles)} onChange={(e) => update(t.id, { requiredRescueRoles: parseCsv(e.target.value) as IncidentTemplate['requiredRescueRoles'] })} className={inp} /></Field>
            <Field label="NPC slots"><input type="number" value={t.npcSlotCount} onChange={(e) => update(t.id, { npcSlotCount: parseInt(e.target.value) || 0 })} className={inp} /></Field>
            <Field label="Obstacle slots"><input type="number" value={t.obstacleSlotCount} onChange={(e) => update(t.id, { obstacleSlotCount: parseInt(e.target.value) || 0 })} className={inp} /></Field>
            <Field label="Device slots"><input type="number" value={t.deviceSlotCount} onChange={(e) => update(t.id, { deviceSlotCount: parseInt(e.target.value) || 0 })} className={inp} /></Field>
            <Field label="Enemy-group slots"><input type="number" value={t.enemyGroupSlotCount} onChange={(e) => update(t.id, { enemyGroupSlotCount: parseInt(e.target.value) || 0 })} className={inp} /></Field>
          </div>
          <div className={lbl}>AI control</div>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
            <Check label="Allow escalation" checked={t.aiControlParameters.allowEscalation} onChange={(v) => ai({ allowEscalation: v })} />
            <Field label="Escalation interval (s)"><input type="number" value={t.aiControlParameters.escalationIntervalSeconds ?? 0} onChange={(e) => ai({ escalationIntervalSeconds: parseInt(e.target.value) || undefined })} className={inp} /></Field>
            <Field label="Max escalation level"><input type="number" value={t.aiControlParameters.maxEscalationLevel ?? 0} onChange={(e) => ai({ maxEscalationLevel: parseInt(e.target.value) || undefined })} className={inp} /></Field>
            <Check label="Allow NPC changes" checked={t.aiControlParameters.allowNPCStateChanges} onChange={(v) => ai({ allowNPCStateChanges: v })} />
            <Check label="Allow object changes" checked={t.aiControlParameters.allowObjectStateChanges} onChange={(v) => ai({ allowObjectStateChanges: v })} />
            <Check label="Allow env changes" checked={t.aiControlParameters.allowEnvironmentStateChanges} onChange={(v) => ai({ allowEnvironmentStateChanges: v })} />
          </div>
          <div className="text-[10px] text-slate-400">{t.defaultObjectives.length} objectives · {t.defaultInitialStateChanges.length} state changes · {t.defaultSolutions.length} solutions (edit in their tabs)</div>
          <button onClick={() => duplicate(t.id)} className="rounded bg-slate-700 px-2 py-1 text-[11px] text-white hover:bg-slate-600">Duplicate template</button>
        </>
      )}
    </div>
  );
};

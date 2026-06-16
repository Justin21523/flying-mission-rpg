import { useIncidentRuntimeStore } from '../../../stores/useIncidentRuntimeStore';
import * as Director from '../../../game/incidents/AIIncidentDirector';
import { lbl } from '../../editor/editorShared';

// 🚨 Active AI incident plan viewer/actions (Batch G §14.2). View the generated plan, its validation, apply it,
// or duplicate it as a reusable template. (Per-field plan editing happens via the template + sub-editors.)
export const IncidentPlanEditorTab = () => {
  const plan = useIncidentRuntimeStore((s) => s.plan ?? s.candidatePlan);
  const runtime = useIncidentRuntimeStore((s) => s.runtime);

  return (
    <div className="space-y-2 text-xs">
      <div className="flex flex-wrap gap-1">
        <button onClick={() => Director.requestIncidentPlanForCurrentWorld({ mode: 'mock' })} className="rounded bg-sky-800 px-2 py-1 text-[11px] text-white hover:bg-sky-700">Generate mock plan</button>
        {plan && <button onClick={() => Director.applyIncidentPlan(plan)} className="rounded bg-emerald-800 px-2 py-1 text-[11px] text-white hover:bg-emerald-700">Apply plan</button>}
        {plan && <button onClick={() => Director.createTemplateFromSnapshot()} className="rounded bg-slate-700 px-2 py-1 text-[11px] text-white hover:bg-slate-600">Duplicate as template</button>}
      </div>
      {runtime.validationErrors.length > 0 && (
        <div className="rounded bg-rose-950/70 p-1.5 text-[10px] text-rose-300">{runtime.validationErrors.map((e, i) => <div key={i}>✗ {e}</div>)}</div>
      )}
      {!plan && <div className="text-[11px] text-slate-400">No plan generated yet. Enter a zone or click Generate.</div>}
      {plan && (
        <>
          <div className={lbl}>{plan.title} · {plan.incidentType} · danger {plan.dangerLevel}</div>
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-800 p-2 text-[10px] text-slate-300">
            <div>npcs: {plan.involvedNPCIds.join(', ') || '—'}</div>
            <div>objects: {plan.involvedObjectIds.join(', ') || '—'}</div>
            <div>obstacles: {(plan.involvedObstacleIds ?? []).join(', ') || '—'}</div>
            <div>devices: {(plan.involvedDeviceIds ?? []).join(', ') || '—'}</div>
            <div>area: [{plan.affectedArea.center.map((n) => n.toFixed(0)).join(', ')}] r{plan.affectedArea.radius}</div>
            <div>time: {plan.timeLimitSeconds ?? '∞'}s</div>
          </div>
          <pre className="max-h-64 overflow-auto rounded bg-slate-950/80 p-2 text-[9px] text-slate-300">{JSON.stringify(plan, null, 1)}</pre>
        </>
      )}
    </div>
  );
};

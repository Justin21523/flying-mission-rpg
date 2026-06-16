import { useState } from 'react';
import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';
import { useIncidentNpcStateStore } from '../../stores/useIncidentNpcStateStore';
import { useIncidentHazardStore } from '../../stores/useIncidentHazardStore';
import { allIncidentTemplates } from '../../stores/useIncidentEditorStore';
import * as Director from '../../game/incidents/AIIncidentDirector';
import * as Debug from '../../game/incidents/IncidentDebugTools';
import { replaySavedAt } from '../../game/incidents/IncidentReplayController';

// 🚨 Incident Debug Panel (Batch G §15) — generate/validate/apply/run incidents + god-mode controls. All routed
// through the director (never raw store writes).
const btn = 'rounded px-2 py-0.5 text-[11px] text-white';
export const IncidentDebugPanel = () => {
  const candidate = useIncidentRuntimeStore((s) => s.candidatePlan);
  const plan = useIncidentRuntimeStore((s) => s.plan);
  const runtime = useIncidentRuntimeStore((s) => s.runtime);
  const npcCount = useIncidentNpcStateStore((s) => Object.keys(s.npcs).length);
  const hazCount = useIncidentHazardStore((s) => Object.values(s.hazards).filter((h) => h.active).length);
  const [templateId, setTemplateId] = useState<string>('');
  const [manual, setManual] = useState('');
  const [showManual, setShowManual] = useState(false);
  const templates = allIncidentTemplates();
  const shown = plan ?? candidate;

  return (
    <div className="pointer-events-auto fixed right-4 top-[8.5rem] z-40 max-h-[80vh] w-80 overflow-auto rounded-xl border border-amber-500/30 bg-slate-900/92 p-3 text-slate-100 shadow-xl backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">🚨 AI Incident Debug</div>

      <div className="mt-1 flex items-center gap-1">
        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="grow rounded bg-slate-800 px-1 py-0.5 text-[10px]">
          <option value="">(first / random)</option>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        <button className={`${btn} bg-sky-800 hover:bg-sky-700`} onClick={() => Director.requestIncidentPlanForCurrentWorld({ mode: 'mock', templateId: templateId || undefined })}>Generate Mock</button>
        <button className={`${btn} bg-sky-800 hover:bg-sky-700`} onClick={() => Director.requestIncidentPlanForCurrentWorld({ mode: 'template-random' })}>Random</button>
        <button className={`${btn} bg-slate-700 hover:bg-slate-600`} onClick={() => setShowManual((v) => !v)}>Manual JSON</button>
      </div>
      {showManual && (
        <div className="mt-1">
          <textarea value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Paste IncidentPlan JSON" className="h-20 w-full rounded bg-slate-950 p-1 text-[9px] text-slate-200" />
          <button className={`${btn} mt-1 bg-sky-800 hover:bg-sky-700`} onClick={() => Director.requestIncidentPlanForCurrentWorld({ mode: 'manual-json', manualJson: manual })}>Validate manual JSON</button>
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-1">
        <button disabled={!candidate} className={`${btn} ${candidate ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-slate-800 text-slate-600'}`} onClick={() => candidate && Director.applyIncidentPlan(candidate)}>Apply + Start</button>
        <button className={`${btn} bg-indigo-800 hover:bg-indigo-700`} onClick={() => Director.generateAndStart({ templateId: templateId || undefined })}>Gen+Apply</button>
        <button className={`${btn} bg-rose-800 hover:bg-rose-700`} onClick={() => Debug.debugClearIncident()}>Clear</button>
      </div>

      {runtime.validationErrors.length > 0 && (
        <div className="mt-1 rounded bg-rose-950/70 p-1 text-[9px] text-rose-300">{runtime.validationErrors.map((e, i) => <div key={i}>✗ {e}</div>)}</div>
      )}

      <div className="mt-2 text-[9px] text-slate-400">status <b className="text-amber-200">{runtime.status}</b> · danger {runtime.dangerLevel} · esc {runtime.currentEscalationLevel} · npcs {npcCount} · hazards {hazCount} · changes {runtime.appliedStateChangeIds.length} · replay {runtime.replayEvents.length}</div>

      {plan && (
        <>
          <div className="mt-2 text-[10px] font-semibold text-slate-200">Objectives — force complete:</div>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {plan.objectiveSteps.map((o) => (
              <button key={o.id} className={`${btn} ${runtime.completedObjectiveStepIds.includes(o.id) ? 'bg-emerald-700' : 'bg-slate-700 hover:bg-slate-600'}`} title={o.label} onClick={() => Debug.debugForceCompleteObjective(o.id)}>{o.label.split(' ')[0]}</button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <button className={`${btn} bg-emerald-800 hover:bg-emerald-700`} onClick={() => Debug.debugForceCompleteIncident()}>✓ Complete</button>
            <button className={`${btn} bg-rose-800 hover:bg-rose-700`} onClick={() => Debug.debugForceFailIncident()}>✗ Fail</button>
            <button className={`${btn} ${runtime.debug.freezeEscalation ? 'bg-cyan-700' : 'bg-slate-700 hover:bg-slate-600'}`} onClick={() => Debug.debugToggleFreezeEscalation()}>Freeze esc</button>
            <button className={`${btn} bg-orange-800 hover:bg-orange-700`} onClick={() => Debug.debugIncreaseDanger()}>+Danger</button>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            <button className={`${btn} bg-slate-700 hover:bg-slate-600`} onClick={() => { Director.saveSnapshot(); }}>Save snapshot</button>
            <button className={`${btn} bg-slate-700 hover:bg-slate-600`} onClick={() => Director.createTemplateFromSnapshot()}>→ Template</button>
            <button className={`${btn} bg-slate-700 hover:bg-slate-600`} onClick={() => replaySavedAt(0)}>Replay last</button>
          </div>
        </>
      )}

      {shown && (
        <pre className="mt-2 max-h-32 overflow-auto rounded bg-slate-950/80 p-1.5 text-[8px] text-slate-300">{JSON.stringify({ id: shown.incidentId, type: shown.incidentType, danger: shown.dangerLevel, objectives: shown.objectiveSteps.length, solutions: shown.availableSolutions.length, npcs: shown.involvedNPCIds, obstacles: shown.involvedObstacleIds, devices: shown.involvedDeviceIds }, null, 1)}</pre>
      )}
    </div>
  );
};

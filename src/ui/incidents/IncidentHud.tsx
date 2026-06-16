import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';
import { useUiStore } from '../../stores/uiStore';
import { useDevStore } from '../../stores/devStore';
import { getIncidentTypeDefinition } from '../../data/incidents/incidentTypeDefinitions';
import { IncidentObjectivePanel } from './IncidentObjectivePanel';
import { IncidentStatePanel } from './IncidentStatePanel';
import { IncidentSolutionHintPanel } from './IncidentSolutionHintPanel';
import { IncidentTimerBar } from './IncidentTimerBar';
import { IncidentDangerMeter } from './IncidentDangerMeter';
import { IncidentResultToast } from './IncidentResultToast';

// Composed Incident HUD (Batch G §12). Shows the active incident's title/type, danger, timer, objectives,
// state, and solution hints. Mounted in App over the zone phases. Debug strip in Edit Mode / FSM debug.
export const IncidentHud = () => {
  const plan = useIncidentRuntimeStore((s) => s.plan);
  const runtime = useIncidentRuntimeStore((s) => s.runtime);
  const editMode = useUiStore((s) => s.editMode);
  const fsmDebug = useDevStore((s) => s.fsmDebug);
  if (!plan) return <IncidentResultToast />;
  const def = getIncidentTypeDefinition(plan.incidentType);

  return (
    <>
      <div className="pointer-events-none fixed right-4 top-24 z-30 w-64 rounded-xl border border-amber-500/30 bg-slate-900/85 p-2 text-slate-100 shadow-lg backdrop-blur">
        <div className="flex items-center gap-1">
          <span>{def.icon}</span>
          <span className="text-xs font-bold text-amber-200">{plan.title}</span>
        </div>
        <div className="text-[9px] uppercase tracking-wide text-slate-400">{def.label}</div>
        <IncidentDangerMeter />
        <IncidentTimerBar />
        <IncidentObjectivePanel />
        <IncidentStatePanel />
        <IncidentSolutionHintPanel />
        {(editMode || fsmDebug) && (
          <div className="mt-1 border-t border-slate-700 pt-1 text-[9px] text-slate-500">
            id {runtime.activeIncidentId} · {runtime.status} · esc {runtime.currentEscalationLevel} · changes {runtime.appliedStateChangeIds.length} · replay {runtime.replayEvents.length}
            {runtime.validationErrors.length > 0 && <div className="text-rose-400">⚠ {runtime.validationErrors.length} validation errors</div>}
          </div>
        )}
      </div>
      <IncidentResultToast />
    </>
  );
};

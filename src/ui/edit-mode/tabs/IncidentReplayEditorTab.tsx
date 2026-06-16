import { useIncidentRuntimeStore } from '../../../stores/useIncidentRuntimeStore';
import { exportReplayData } from '../../../game/incidents/IncidentSnapshotController';
import { replayIncident, replaySavedAt } from '../../../game/incidents/IncidentReplayController';
import { lbl } from '../../editor/editorShared';

// 🚨 Incident replay viewer (Batch G §14.6) — shows the active incident's event log + saved replays, exports
// replay JSON, and replays a saved incident.
const EVENT_ICON: Record<string, string> = { 'incident-started': '▶', 'state-change-applied': '⚙', 'objective-completed': '✓', 'objective-failed': '✗', escalation: '⚠', success: '🏁', failed: '💥', cancelled: '⏹', 'player-action': '•' };

export const IncidentReplayEditorTab = () => {
  const runtime = useIncidentRuntimeStore((s) => s.runtime);
  const saved = useIncidentRuntimeStore((s) => s.savedReplays);
  const plan = useIncidentRuntimeStore((s) => s.plan);
  const exportJson = () => { const d = exportReplayData(); if (d) { navigator.clipboard?.writeText(JSON.stringify(d, null, 2)).catch(() => {}); } };

  return (
    <div className="space-y-2 text-xs">
      <div className="flex flex-wrap gap-1">
        <button onClick={exportJson} disabled={!plan} className={`rounded px-2 py-1 text-[11px] text-white ${plan ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-800 text-slate-600'}`}>Export replay JSON</button>
      </div>

      <div className={lbl}>Active incident events ({runtime.replayEvents.length})</div>
      <div className="max-h-48 space-y-0.5 overflow-auto rounded-lg border border-slate-800 p-2 text-[10px] text-slate-300">
        {runtime.replayEvents.length === 0 && <div className="text-slate-500">No events yet.</div>}
        {runtime.replayEvents.map((e, i) => (
          <div key={i}>{EVENT_ICON[e.type] ?? '•'} <span className="text-slate-400">{(e.t / 1000).toFixed(1)}s</span> {e.type} {e.detail ? `— ${e.detail}` : ''}{e.targetId ? ` (${e.targetId})` : ''}</div>
        ))}
      </div>

      <div className={lbl}>Saved replays ({saved.length})</div>
      <div className="space-y-1">
        {saved.map((r, i) => (
          <div key={i} className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[10px]">
            <span className="grow">{r.plan.title} · {r.finalStatus} · {r.events.length} events</span>
            <button onClick={() => replaySavedAt(i)} className="rounded bg-sky-800 px-2 py-0.5 text-white hover:bg-sky-700">Replay</button>
          </div>
        ))}
        {plan && <button onClick={() => { const d = exportReplayData(); if (d) replayIncident(d); }} className="rounded bg-indigo-800 px-2 py-1 text-[11px] text-white hover:bg-indigo-700">Replay current setup</button>}
      </div>
    </div>
  );
};

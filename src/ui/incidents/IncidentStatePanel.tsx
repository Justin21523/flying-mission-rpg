import { useIncidentNpcStateStore } from '../../stores/useIncidentNpcStateStore';
import { useIncidentObjectStateStore } from '../../stores/useIncidentObjectStateStore';
import { useIncidentHazardStore } from '../../stores/useIncidentHazardStore';

// Live NPC / object / hazard status readout (Batch G §12).
const NPC_ICON: Record<string, string> = { trapped: '🆘', panicked: '😱', injured: '🤕', 'waiting-rescue': '⏳', evacuating: '🏃', safe: '✅', idle: '🙂' };
export const IncidentStatePanel = () => {
  const npcs = useIncidentNpcStateStore((s) => s.npcs);
  const objects = useIncidentObjectStateStore((s) => s.objects);
  const hazards = useIncidentHazardStore((s) => s.hazards);
  const npcList = Object.values(npcs);
  const activeHazards = Object.values(hazards).filter((h) => h.active);
  if (npcList.length === 0 && activeHazards.length === 0) return null;
  return (
    <div className="mt-1 text-[10px] text-slate-300">
      {npcList.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {npcList.map((n) => <span key={n.id} title={n.id} className="rounded bg-slate-800 px-1">{NPC_ICON[n.state] ?? '•'} {n.state}</span>)}
        </div>
      )}
      {(activeHazards.length > 0 || Object.keys(objects).length > 0) && (
        <div className="mt-0.5 flex flex-wrap gap-1 text-slate-400">
          {activeHazards.map((h) => <span key={h.id} className="rounded bg-rose-900/60 px-1">⚠ {h.kind}</span>)}
        </div>
      )}
    </div>
  );
};

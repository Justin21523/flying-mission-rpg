import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { getStageDefinition } from '../../stores/useStageEditorStore';
import { getLevelLayout } from '../../stores/useLevelEditorStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';

export const ObjectiveFocusPanel = () => {
  const state = useStageProgressionStore();
  // When an Advanced Mission Zone is authoritative, MissionZoneHud shows the live segment objective checklist —
  // this stage-level panel would otherwise display a stale/contradictory stage objective (e.g. "reach Dock"
  // while the segment says "defeat the ambush"). Suppress it during zone play; keep it for legacy stages.
  const advZoneActive = useAdvancedMissionZoneStore((s) => !!s.activeZoneId);
  const stage = state.activeStageId ? getStageDefinition(state.activeStageId) : undefined;
  const layout = state.activeLevelLayoutId ? getLevelLayout(state.activeLevelLayoutId) : undefined;
  if (advZoneActive) return null;
  if (!stage || state.status !== 'playing') return null;
  const nextObjective = stage.objectiveIds.find((id) => !state.completedObjectiveIds.includes(id)) ?? 'Reach final extraction';
  const currentIndex = stage.objectiveIds.findIndex((id) => id === nextObjective);
  const marker = layout?.objectiveMarkers.find((item) => item.segmentId === state.activeSegmentId);
  return (
    <div className="rounded-xl border border-sky-700/50 bg-slate-950/80 p-3 text-xs text-slate-200 shadow-lg backdrop-blur">
      <div className="text-[10px] font-bold uppercase tracking-wide text-sky-300">Main Objective</div>
      <div className="mt-1 font-bold text-slate-100">{nextObjective}</div>
      <div className="mt-1 text-slate-400">Step {Math.max(1, currentIndex + 1)} / {stage.objectiveIds.length} · Segment {state.activeSegmentId ?? '—'}</div>
      <div className="mt-1 text-amber-200">Next marker: {marker?.label ?? 'Follow the route guide'}</div>
      <div className="mt-1 text-slate-400">Recommended: {stage.recommendedCharacterIds.slice(0, 2).map((id) => id.replace('char_', '')).join(' / ')}</div>
    </div>
  );
};

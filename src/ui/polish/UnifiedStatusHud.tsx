import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { ObjectiveFocusPanel } from './ObjectiveFocusPanel';

export const UnifiedStatusHud = () => {
  const status = useStageProgressionStore((state) => state.status);
  const activeEncounterIds = useStageProgressionStore((state) => state.activeEncounterIds);
  const activeIncidentIds = useStageProgressionStore((state) => state.activeIncidentIds);
  const activeBossId = useStageProgressionStore((state) => state.activeBossId);
  if (status !== 'playing') return null;
  return (
    <div className="pointer-events-none fixed left-4 top-20 z-[53] flex w-80 flex-col gap-2">
      <ObjectiveFocusPanel />
      <div className="rounded-xl border border-slate-700 bg-slate-950/75 p-2 text-[11px] text-slate-300 backdrop-blur">
        <div>Encounter: {activeEncounterIds[0] ?? 'none'}</div>
        <div>Incident: {activeIncidentIds[0] ?? 'none'}</div>
        <div>Boss: {activeBossId ?? 'none'}</div>
      </div>
    </div>
  );
};

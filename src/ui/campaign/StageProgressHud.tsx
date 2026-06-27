import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { StageMinimapPanel } from './StageMinimapPanel';
import { StageObjectiveTracker } from './StageObjectiveTracker';

export const StageProgressHud = () => {
  const status = useStageProgressionStore((state) => state.status);
  // Batch N (c) — when an Advanced Mission Zone is authoritative, MissionZoneHud already shows the live
  // segment objective checklist; drop the redundant StageObjectiveTracker to avoid a duplicate objective list.
  // The route minimap (stage-wide, not redundant) stays in both cases.
  const advZoneActive = useAdvancedMissionZoneStore((s) => !!s.activeZoneId);
  if (status !== 'playing') return null;
  return (
    <div className="pointer-events-none fixed left-4 top-20 z-40 flex w-80 flex-col gap-2">
      {!advZoneActive && <StageObjectiveTracker />}
      <StageMinimapPanel />
    </div>
  );
};

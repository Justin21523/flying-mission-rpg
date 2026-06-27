import { useGameStore } from '../../stores/game/useGameStore';
import { getStageDefinition } from '../../stores/useStageEditorStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { ModeIndicatorBadge } from './ModeIndicatorBadge';

export const GameTopBar = () => {
  const phase = useGameStore((state) => state.phase);
  const stageId = useStageProgressionStore((state) => state.activeStageId);
  const stage = stageId ? getStageDefinition(stageId) : undefined;
  return (
    <div className="pointer-events-none fixed left-1/2 top-3 z-[55] flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs text-slate-300 backdrop-blur">
      <ModeIndicatorBadge />
      <span>{stage?.name ?? 'Aero Rescue RPG'}</span>
      <span className="text-slate-500">·</span>
      <span>{phase}</span>
    </div>
  );
};

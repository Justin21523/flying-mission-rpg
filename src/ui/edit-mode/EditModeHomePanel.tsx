import { useGameStore } from '../../stores/game/useGameStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { EditModeQuickActions } from './EditModeQuickActions';
import { EditModeValidationSummary } from './EditModeValidationSummary';
import { EditModeDemoGuide } from './EditModeDemoGuide';
import { EditModeExportPanel } from './EditModeExportPanel';

export const EditModeHomePanel = () => {
  const phase = useGameStore((state) => state.phase);
  const activeStageId = useStageProgressionStore((state) => state.activeStageId);
  const activeSegmentId = useStageProgressionStore((state) => state.activeSegmentId);
  const status = useStageProgressionStore((state) => state.status);
  return (
    <div className="space-y-3 text-slate-100">
      <div className="rounded-lg border border-violet-500/30 bg-violet-950/25 p-3">
        <div className="text-[11px] font-bold uppercase text-violet-200">Edit Mode Home</div>
        <div className="mt-2 grid gap-2 text-xs md:grid-cols-3">
          <Info label="Phase" value={phase} />
          <Info label="Stage" value={activeStageId ?? 'none'} />
          <Info label="Segment" value={activeSegmentId ?? 'none'} />
          <Info label="Stage status" value={status} />
          <Info label="Active systems" value="Campaign · Level · Combat · Incident · Boss · VFX" />
          <Info label="Export" value="Use panel below" />
        </div>
      </div>
      <EditModeQuickActions />
      <EditModeValidationSummary />
      <EditModeDemoGuide />
      <EditModeExportPanel />
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded bg-slate-950/50 p-2">
    <div className="text-[10px] uppercase text-slate-500">{label}</div>
    <div className="truncate text-xs font-bold text-slate-200">{value}</div>
  </div>
);

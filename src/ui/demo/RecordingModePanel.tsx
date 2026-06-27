import { PORTFOLIO_SHOT_LIST } from '../../data/demo/portfolioShotList';
import { applyRecordingSettings, exportRecordingChecklist, jumpToRecordingShot, resetRecordingMode } from '../../game/demo/PortfolioRecordingActions';
import { usePortfolioRecordingStore } from '../../stores/usePortfolioRecordingStore';

export const RecordingModePanel = () => {
  const enabled = usePortfolioRecordingStore((state) => state.enabled);
  const currentShotId = usePortfolioRecordingStore((state) => state.currentShotId);
  const update = usePortfolioRecordingStore((state) => state.updateRecordingMode);
  return (
    <div className="mt-2 rounded-lg border border-fuchsia-500/30 bg-fuchsia-950/15 p-2">
      <div className="mb-2 flex items-center justify-between">
        <b className="text-fuchsia-200">Recording</b>
        <button className="rounded bg-slate-800 px-2 py-1" onClick={() => update({ enabled: !enabled })}>{enabled ? 'On' : 'Off'}</button>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <button className="rounded bg-fuchsia-700/70 px-2 py-1 text-[11px] font-bold text-white" onClick={applyRecordingSettings}>Apply Settings</button>
        <button className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200" onClick={resetRecordingMode}>Reset</button>
        <button className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200" onClick={() => update({ showSafeFrame: !usePortfolioRecordingStore.getState().showSafeFrame })}>Safe Frame</button>
        <button className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200" onClick={() => console.info('[portfolio-shot-list]', exportRecordingChecklist())}>Export Shots</button>
      </div>
      <select
        className="mt-2 w-full rounded bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
        value={currentShotId}
        onChange={(event) => jumpToRecordingShot(event.target.value)}
      >
        {PORTFOLIO_SHOT_LIST.map((shot) => <option key={shot.id} value={shot.id}>{shot.title}</option>)}
      </select>
    </div>
  );
};

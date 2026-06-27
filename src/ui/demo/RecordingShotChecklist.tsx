import { PORTFOLIO_SHOT_LIST } from '../../data/demo/portfolioShotList';
import { jumpToRecordingShot } from '../../game/demo/PortfolioRecordingActions';
import { usePortfolioRecordingStore } from '../../stores/usePortfolioRecordingStore';

export const RecordingShotChecklist = () => {
  const show = usePortfolioRecordingStore((state) => state.enabled && state.showShotChecklist);
  const currentShotId = usePortfolioRecordingStore((state) => state.currentShotId);
  if (!show) return null;
  const current = PORTFOLIO_SHOT_LIST.find((shot) => shot.id === currentShotId) ?? PORTFOLIO_SHOT_LIST[0];
  return (
    <div className="pointer-events-auto fixed left-3 bottom-3 z-[73] w-80 rounded-xl border border-slate-700 bg-slate-950/88 p-3 text-xs text-slate-200 shadow-2xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <b className="text-fuchsia-200">Recording Shot</b>
        <span className="text-[10px] text-slate-500">{PORTFOLIO_SHOT_LIST.findIndex((shot) => shot.id === current.id) + 1}/{PORTFOLIO_SHOT_LIST.length}</span>
      </div>
      <div className="font-bold text-slate-100">{current.title}</div>
      <div className="mt-1 text-slate-400">{current.purpose}</div>
      <div className="mt-2 rounded bg-slate-900/80 p-2 text-[11px] text-slate-300">{current.acceptanceText}</div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        {PORTFOLIO_SHOT_LIST.map((shot) => (
          <button
            key={shot.id}
            className={`rounded border px-2 py-1 text-left text-[10px] ${shot.id === current.id ? 'border-fuchsia-400 text-fuchsia-100' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
            onClick={() => jumpToRecordingShot(shot.id)}
          >
            {shot.title}
          </button>
        ))}
      </div>
    </div>
  );
};

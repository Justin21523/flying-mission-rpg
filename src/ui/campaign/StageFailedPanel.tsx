import { Btn, panel } from '../game/screenChrome';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

export const StageFailedPanel = () => (
  <div className={`mx-auto max-w-xl ${panel} p-5`}>
    <div className="text-sm font-bold text-rose-200">Stage Failed</div>
    <p className="mt-2 text-sm text-slate-300">The current stage objective failed.</p>
    <div className="mt-4 flex justify-end">
      <Btn tone="primary" onClick={() => useStageProgressionStore.getState().setStatus('briefing')}>Retry Briefing</Btn>
    </div>
  </div>
);

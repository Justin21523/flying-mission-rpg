import { usePoll } from '../usePoll';
import { transformationHandle, txFrame } from '../../game/transformation/transformationRuntime';
import { transformationDev } from '../../game/transformation/transformationDev';

// Transformation HUD — character/mode, timeline progress, current stage, and skip/replay. During the
// interactive showcase it shows the control prompts. Polls the handle (no per-frame re-render).
export const TransformationHud = () => {
  usePoll(100);
  const h = transformationHandle;
  const showcase = h.phase === 'showcase';
  const prompt = txFrame.def?.interactionShowcase.promptText;

  return (
    <>
      <div className="pointer-events-none fixed left-1/2 top-3 z-[60] w-72 -translate-x-1/2 rounded-xl border border-fuchsia-800/50 bg-slate-950/75 p-3 text-xs text-slate-200 backdrop-blur">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-bold text-fuchsia-200">TRANSFORMATION</span>
          <span className="font-mono text-[10px] uppercase text-slate-500">{h.mode}</span>
        </div>
        <div className="my-1 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-amber-300" style={{ width: `${h.progress * 100}%` }} />
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Stage</span>
          <span className="truncate">{h.stageLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Form</span>
          <span className="tabular-nums">{h.form}</span>
        </div>
      </div>

      {/* skip / replay */}
      <div className="pointer-events-auto fixed right-3 top-3 z-[60] flex gap-1.5">
        <button onClick={() => { transformationDev.forceFinish = true; }} className="rounded-lg border border-slate-600/60 bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-800">Skip (Esc)</button>
        <button onClick={() => { transformationDev.reset = true; }} className="rounded-lg border border-slate-600/60 bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-800">Replay</button>
      </div>

      {showcase && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-1">
          <div className="rounded-full bg-fuchsia-950/85 px-4 py-1.5 text-xs font-semibold text-fuchsia-100 backdrop-blur">Showcase — {prompt ?? 'A/D rotate · Enter continue · Esc skip'}</div>
        </div>
      )}
    </>
  );
};

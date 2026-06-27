import { getRuntimeErrors } from '../../game/qa/RuntimeErrorCollector';
import { useDiagnosticsStore } from '../../stores/useDiagnosticsStore';

export const DiagnosticsPanel = () => {
  const errors = useDiagnosticsStore((state) => state.errors);
  const snapshot = JSON.stringify({ diagnostics: errors, runtimeErrors: getRuntimeErrors() }, null, 2);
  return (
    <div className="pointer-events-auto fixed left-3 top-20 z-[76] w-96 rounded-xl border border-slate-700 bg-slate-950/90 p-3 text-xs text-slate-200 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <b className="text-sky-200">Diagnostics</b>
        <button className="rounded bg-slate-800 px-2 py-1" onClick={() => useDiagnosticsStore.getState().clear()}>Clear</button>
      </div>
      <textarea readOnly value={snapshot} className="h-44 w-full resize-none rounded bg-slate-900 p-2 font-mono text-[10px] text-slate-300" />
    </div>
  );
};

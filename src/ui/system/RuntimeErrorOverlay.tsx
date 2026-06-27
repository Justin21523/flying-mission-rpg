import { useDiagnosticsStore } from '../../stores/useDiagnosticsStore';

export const RuntimeErrorOverlay = () => {
  const errors = useDiagnosticsStore((state) => state.errors);
  const open = useDiagnosticsStore((state) => state.overlayOpen);
  if (!open || errors.length === 0) return null;
  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-[90] w-80 rounded-xl border border-rose-500/40 bg-slate-950/95 p-3 text-xs text-slate-200 shadow-2xl">
      <div className="flex items-center justify-between">
        <b className="text-rose-200">Diagnostics captured {errors.length}</b>
        <button className="rounded bg-slate-800 px-2 py-0.5" onClick={() => useDiagnosticsStore.getState().setOverlayOpen(false)}>Close</button>
      </div>
      <div className="mt-2 max-h-32 overflow-auto rounded bg-slate-900/80 p-2 font-mono text-[10px] text-rose-100">{errors[0].message}</div>
    </div>
  );
};

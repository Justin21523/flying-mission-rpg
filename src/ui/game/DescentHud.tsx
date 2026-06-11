// Minimal DESCENT banner (full descent/landing is Batch 7).
export const DescentHud = () => (
  <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center">
    <div className="rounded-2xl border border-sky-700/50 bg-slate-950/80 px-6 py-3 text-center backdrop-blur">
      <div className="text-base font-bold text-sky-200">Descending — robot form</div>
      <div className="mt-0.5 text-[11px] text-slate-400">Landing &amp; rescue arrive in Batch 7 — orbit to look around.</div>
    </div>
  </div>
);

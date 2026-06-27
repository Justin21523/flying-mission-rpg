export const LoadingTransitionScreen = ({ label }: { label?: string }) => (
  <div className="pointer-events-none fixed inset-0 z-[90] hidden items-center justify-center bg-slate-950/80 text-slate-100">
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 text-sm">{label ?? 'Loading stage...'}</div>
  </div>
);

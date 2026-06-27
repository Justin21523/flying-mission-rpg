export const StageCompletionBadge = ({ unlocked, completed }: { unlocked: boolean; completed: boolean }) => {
  const label = completed ? 'Completed' : unlocked ? 'Unlocked' : 'Locked';
  const tone = completed
    ? 'border-emerald-400/60 bg-emerald-950/70 text-emerald-200'
    : unlocked
      ? 'border-sky-400/60 bg-sky-950/70 text-sky-200'
      : 'border-slate-700 bg-slate-900/80 text-slate-400';
  return <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone}`}>{label}</span>;
};

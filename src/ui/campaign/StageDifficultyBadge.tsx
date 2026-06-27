export const StageDifficultyBadge = ({ difficulty }: { difficulty?: number }) => {
  const value = Math.max(1, Math.min(5, difficulty ?? 1));
  const tone = value >= 5 ? 'border-red-400 text-red-200' : value >= 4 ? 'border-orange-400 text-orange-200' : value >= 3 ? 'border-yellow-400 text-yellow-200' : 'border-emerald-400 text-emerald-200';
  return <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${tone}`}>D{value}</span>;
};

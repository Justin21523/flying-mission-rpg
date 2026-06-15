// Small radial-less cooldown bar for a support ability (Batch E). Pure presentational.
export const SupportCooldownIndicator = ({ remainingMs, cooldownSeconds }: { remainingMs: number; cooldownSeconds: number }) => {
  if (remainingMs <= 0 || cooldownSeconds <= 0) return null;
  const frac = Math.min(1, remainingMs / (cooldownSeconds * 1000));
  return (
    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-700">
      <div className="h-full bg-sky-400" style={{ width: `${frac * 100}%` }} />
    </div>
  );
};

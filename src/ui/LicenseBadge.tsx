import { useRescueLicenseStore, getCurrentLicenseTier } from '../stores/rescueLicenseStore';

// POLI — small rescue-license badge (top-left). Shows the player's current tier (driven by rescues
// completed) + progress to the next tier. Editable thresholds in the 🎖 License tab.
export const LicenseBadge = () => {
  const rescues = useRescueLicenseStore((s) => s.rescuesCompleted);
  const tiers = useRescueLicenseStore((s) => s.tiers);
  const tier = getCurrentLicenseTier();
  if (!tier) return null;
  const next = [...tiers].sort((a, b) => a.requiredRescues - b.requiredRescues).find((x) => x.requiredRescues > rescues);

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-amber-500/50 bg-slate-900/80 px-3 py-1.5 text-sm font-semibold text-amber-100 shadow-xl backdrop-blur-md">
      <span className="text-lg">{tier.icon}</span>
      <div className="leading-tight">
        <div>{tier.name}</div>
        <div className="text-[10px] font-normal text-amber-200/70">
          {rescues} rescues{next ? ` · next ${next.icon} in ${next.requiredRescues - rescues}` : ' · max tier'}
        </div>
      </div>
    </div>
  );
};

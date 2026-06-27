import { useBossStore } from '../../stores/game/useBossStore';
import { useNowMs } from '../../game/combat/useNowMs';
import { getBossDemoProfileForBoss } from '../../data/bosses/bossDemoProfiles';

// Transient boss attack telegraph toast (Batch F) — shows the incoming attack while it's warming up.
const LABEL: Record<string, string> = {
  'sweep-beam': 'Sweep Beam',
  'ground-shockwave': 'Shockwave',
  'shield-pulse': 'Shield Pulse',
  'targeted-projectile': 'Incoming Barrage',
  'summon-wave': 'Summoning Reinforcements',
  'charge': 'Charge',
};

export const BossWarningToast = () => {
  const now = useNowMs(120);
  const runtime = useBossStore((s) => s.runtime);
  const warn = [...(runtime?.recentAttackEvents ?? [])].reverse().find((event) => event.kind === 'warning');
  if (!runtime || runtime.status === 'defeated' || !warn || now - warn.atMs > 1700) return null;
  const hint = getBossDemoProfileForBoss(runtime.bossDefinitionId)?.attackHints.find((item) => item.patternType === warn.patternType);
  const label = hint?.label ?? LABEL[warn.patternType] ?? 'Boss Attack';
  return (
    <div className="pointer-events-none fixed left-1/2 top-24 z-30 max-w-[420px] -translate-x-1/2 rounded-lg border border-rose-400/50 bg-slate-900/90 px-3 py-1 text-center text-sm font-bold text-rose-100 shadow-lg backdrop-blur">
      <div>{label}</div>
      {hint?.counterplay && <div className="text-[10px] font-medium text-rose-200/85">{hint.counterplay}</div>}
    </div>
  );
};

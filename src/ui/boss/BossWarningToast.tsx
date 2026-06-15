import { useBossStore } from '../../stores/game/useBossStore';
import { getLastWarning } from '../../game/bosses/BossAttackController';
import { useNowMs } from '../../game/combat/useNowMs';

// Transient boss attack telegraph toast (Batch F) — shows the incoming attack while it's warming up.
const LABEL: Record<string, string> = {
  'sweep-beam': '⚠ Sweep Beam — dodge or shield!',
  'ground-shockwave': '⚠ Shockwave — get out of the ring!',
  'shield-pulse': '⚠ Shield Pulse',
  'targeted-projectile': '⚠ Incoming barrage',
  'summon-wave': '⚠ Summoning reinforcements',
  'charge': '⚠ Charge!',
};

export const BossWarningToast = () => {
  const now = useNowMs(120);
  const runtime = useBossStore((s) => s.runtime);
  const warn = getLastWarning();
  if (!runtime || runtime.status === 'defeated' || !warn || now - warn.atMs > 1400) return null;
  return (
    <div className="pointer-events-none fixed left-1/2 top-24 z-30 -translate-x-1/2 rounded-lg border border-rose-400/50 bg-slate-900/85 px-3 py-1 text-sm font-bold text-rose-200 shadow-lg backdrop-blur">
      {LABEL[warn.patternType] ?? '⚠ Boss attack!'}
    </div>
  );
};

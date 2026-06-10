import { usePoll } from './usePoll';
import { useBoostStore } from '../stores/boostStore';
import { getBoostConfig } from '../stores/editorBoostStore';
import { useT } from '../i18n/useT';

// POLI — boost meter HUD (bottom-centre). Fills as you collect ground pickups; when full it glows
// "READY — R" and pressing R launches super-boost mode (fast flight + afterimage). Polled, not subscribed.
export const BoostMeterHud = () => {
  usePoll(120);
  const t = useT();
  const s = useBoostStore.getState();
  const max = getBoostConfig().meterMax || 100;
  const pct = Math.max(0, Math.min(100, (s.meter / max) * 100));
  const ready = !s.superActive && s.meter >= max;

  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 z-[60] w-72 -translate-x-1/2 select-none">
      <div className="mb-1 flex items-center justify-between px-1 text-[11px] font-bold">
        <span className={s.superActive ? 'text-cyan-200' : 'text-amber-200'}>{s.superActive ? `⚡ ${t('superBoost')}` : `⭐ ${t('boost')}`}</span>
        {ready && <span className="animate-pulse rounded bg-cyan-500/30 px-1.5 text-cyan-100">{t('boostReady')}</span>}
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full border border-slate-600/70 bg-slate-900/70 shadow-inner">
        <div
          className="h-full rounded-full transition-[width] duration-150"
          style={{
            width: `${pct}%`,
            background: s.superActive
              ? 'linear-gradient(90deg,#22d3ee,#a78bfa)'
              : ready ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#34d399,#10b981)',
            boxShadow: ready || s.superActive ? '0 0 10px rgba(56,189,248,0.7)' : 'none',
          }}
        />
      </div>
    </div>
  );
};

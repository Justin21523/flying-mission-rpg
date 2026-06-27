import { useEffect, useState } from 'react';
import { getRandomBossRuntime } from '../../game/bosses/RandomBossDirector';
import { useBossStore } from '../../stores/game/useBossStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { useEditorMissionZoneStore } from '../../stores/game/editorMissionZoneStore';
import { useEditorRandomBossPoolStore } from '../../stores/game/editorCombatStore';

// Batch L polish — makes the otherwise-invisible threat gauge legible: a tension bar that fills as you fight,
// with a "BOSS INCOMING" warning near the threshold. Visibility is derived REACTIVELY from the active zone's
// random-boss pool (so it shows reliably during zone play, not only while the director happens to be pumping);
// the live fill fraction is polled from the RandomBossDirector via rAF. Hidden while a boss fight is active.
export const ThreatGaugeHud = () => {
  const activeZoneId = useAdvancedMissionZoneStore((s) => s.activeZoneId);
  const zone = useEditorMissionZoneStore((s) => s.items.find((z) => z.id === activeZoneId));
  const pool = useEditorRandomBossPoolStore((s) => s.items.find((p) => p.id === zone?.randomBossPoolId));
  const threshold = pool?.threat.threshold ?? 0;
  const active = !!pool && pool.enabled && threshold > 0;

  const [frac, setFrac] = useState(0);
  const [bossActive, setBossActive] = useState(false);

  useEffect(() => {
    if (!active) return;
    let raf = 0; let lastFrac = -1; let lastBoss = false;
    const tick = () => {
      const rt = getRandomBossRuntime();
      const boss = useBossStore.getState().runtime;
      const ba = !!boss && boss.status !== 'defeated' && boss.status !== 'inactive';
      const f = Math.max(0, Math.min(1, rt.gauge / threshold));
      if (Math.abs(f - lastFrac) >= 0.01) { lastFrac = f; setFrac(f); }
      if (ba !== lastBoss) { lastBoss = ba; setBossActive(ba); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, threshold]);

  if (!active || bossActive) return null;
  const imminent = frac >= 0.85;
  return (
    <div className="pointer-events-none fixed left-1/2 top-3 z-30 w-72 -translate-x-1/2 text-center">
      <div className="flex items-center justify-between px-0.5 text-[10px] font-semibold uppercase tracking-widest">
        <span className={imminent ? 'text-rose-300' : 'text-amber-300/80'}>Threat</span>
        {imminent && <span className="animate-pulse font-black text-rose-400">⚠ BOSS INCOMING</span>}
      </div>
      <div className="mt-0.5 h-2 w-full overflow-hidden rounded-full border border-slate-700/70 bg-slate-900/70 shadow">
        <div
          className={`h-full rounded-full transition-[width] duration-150 ${imminent ? 'bg-rose-500' : 'bg-amber-500'}`}
          style={{ width: `${frac * 100}%` }}
        />
      </div>
    </div>
  );
};

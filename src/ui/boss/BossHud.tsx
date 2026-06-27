import { useBossStore } from '../../stores/game/useBossStore';
import { useDevStore } from '../../stores/devStore';
import { useNowMs } from '../../game/combat/useNowMs';
import { buildBossHudViewModel } from './BossHudViewModel';

// Boss HUD (Batch F) — name + HP + shield + phase + phase objective + a recommended hint, plus a debug
// readout (active phase / weakpoints / waves + force-phase) when fsmDebug / editMode. Reads the boss store.
const Bar = ({ value, max, color, label }: { value: number; max: number; color: string; label: string }) => (
  <div className="mt-0.5">
    <div className="flex justify-between text-[9px] text-slate-300"><span>{label}</span><span>{Math.max(0, Math.round(value))}/{max}</span></div>
    <div className="h-2 w-full overflow-hidden rounded bg-slate-800">
      <div className="h-full rounded transition-all" style={{ width: `${Math.max(0, Math.min(1, value / Math.max(1, max))) * 100}%`, background: color }} />
    </div>
  </div>
);

export const BossHud = () => {
  useNowMs(200);
  useBossStore((s) => s.version);
  const runtime = useBossStore((s) => s.runtime);
  const fsmDebug = useDevStore((s) => s.fsmDebug);
  if (!runtime || runtime.status === 'inactive' || runtime.status === 'intro') return null; // intro → BossIntroOverlay

  const vm = buildBossHudViewModel(runtime);
  const defeated = runtime.status === 'defeated';
  const enraged = (runtime.timers?.enraged ?? 0) > 0;
  const enrageRemaining = runtime.timers?.enrageRemaining ?? -1;

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-30 w-[440px] -translate-x-1/2 rounded-xl border border-slate-600/40 bg-slate-900/85 p-2 text-slate-100 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: vm.phaseColor }}>{vm.bossName}</span>
        <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide" style={{ background: vm.phaseColor, color: '#0b1020' }}>
          {defeated ? 'Defeated' : `${vm.phaseProgressLabel} · ${vm.phaseLabel}`}
        </span>
      </div>
      <Bar value={runtime.currentHp} max={runtime.maxHp} color="#ef4444" label="HP" />
      {runtime.maxShield > 0 && <Bar value={runtime.currentShield} max={runtime.maxShield} color="#38bdf8" label="Shield" />}
      {!defeated && enraged && <div className="mt-1 animate-pulse rounded bg-orange-600/80 px-2 py-0.5 text-center text-[10px] font-bold tracking-wide text-white">🔥 ENRAGED — boss damage increased</div>}
      {!defeated && !enraged && enrageRemaining >= 0 && (
        <div className="mt-1 text-[9px] text-orange-300/90">Enrage in {enrageRemaining}s</div>
      )}
      {!defeated && vm.phaseObjective && <div className="mt-1 text-[10px] text-amber-300/90">{vm.phaseObjective}</div>}
      {!defeated && vm.counterplay.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {vm.counterplay.map((hint) => <span key={hint} className="rounded bg-sky-950/70 px-1.5 py-0.5 text-[9px] text-sky-200">{hint}</span>)}
        </div>
      )}
      {vm.weakpoints.length > 0 && !defeated && (
        <div className="mt-1 flex flex-wrap gap-1">
          {vm.weakpoints.map((wp) => {
            const style = wp.state === 'destroyed'
              ? 'bg-slate-700 text-slate-500 line-through'
              : wp.state === 'exposed'
                ? 'bg-rose-600 text-white shadow shadow-rose-500/30'
                : 'bg-slate-800 text-slate-300';
            return <span key={wp.id} className={`rounded px-1.5 py-0.5 text-[9px] ${style}`}>{wp.label}: {wp.state}</span>;
          })}
        </div>
      )}
      {fsmDebug && (
        <div className="mt-1 border-t border-slate-700/50 pt-1 text-[9px] text-slate-400">
          phase: {runtime.activePhaseId ?? '—'} · done: [{runtime.completedPhaseIds.join(', ')}] · wp✗: [{runtime.destroyedWeakpointIds.join(', ')}] · waves✓: [{runtime.clearedSummonWaveIds.join(', ')}]
        </div>
      )}
    </div>
  );
};

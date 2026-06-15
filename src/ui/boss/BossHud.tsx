import { useBossStore } from '../../stores/game/useBossStore';
import { getBoss, getBossPhase, getWeakpoint } from '../../stores/game/useBossEditorStore';
import { useDevStore } from '../../stores/devStore';
import { useNowMs } from '../../game/combat/useNowMs';

// Boss HUD (Batch F) — name + HP + shield + phase + phase objective + a recommended hint, plus a debug
// readout (active phase / weakpoints / waves + force-phase) when fsmDebug / editMode. Reads the boss store.
const PHASE_HINT: Record<string, string> = {
  phase_harbor_p1: '🔍 Scan the core · 🛡 break the shield · 🎯 hit the weakpoint',
  phase_harbor_p2: '⚔ Clear the summoned enemies to stun the boss',
  phase_harbor_p3: '💨 Dodge / 🛡 shield the sweep beam · 🎯 destroy the overload core',
};

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
  if (!runtime || runtime.status === 'inactive') return null;

  const boss = getBoss(runtime.bossDefinitionId);
  const phase = getBossPhase(runtime.activePhaseId);
  const phaseColor = phase?.editorMeta?.phaseColor ?? boss?.visual.themeColor ?? '#38bdf8';
  const defeated = runtime.status === 'defeated';

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-30 w-[440px] -translate-x-1/2 rounded-xl border border-slate-600/40 bg-slate-900/85 p-2 text-slate-100 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: phaseColor }}>{boss?.name ?? 'Boss'}</span>
        <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide" style={{ background: phaseColor, color: '#0b1020' }}>
          {defeated ? 'Defeated' : phase?.name ?? '—'}
        </span>
      </div>
      <Bar value={runtime.currentHp} max={runtime.maxHp} color="#ef4444" label="HP" />
      {runtime.maxShield > 0 && <Bar value={runtime.currentShield} max={runtime.maxShield} color="#38bdf8" label="Shield" />}
      {!defeated && phase && <div className="mt-1 text-[10px] text-amber-300/90">{PHASE_HINT[phase.id] ?? phase.editorMeta?.notes ?? ''}</div>}
      {runtime.activeWeakpointIds.length > 0 && !defeated && (
        <div className="mt-1 flex flex-wrap gap-1">
          {runtime.activeWeakpointIds.map((wid) => {
            const destroyed = runtime.destroyedWeakpointIds.includes(wid);
            return <span key={wid} className={`rounded px-1.5 py-0.5 text-[9px] ${destroyed ? 'bg-slate-700 text-slate-500 line-through' : 'bg-rose-900/60 text-rose-200'}`}>{getWeakpoint(wid)?.displayName ?? wid}</span>;
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

import { useState } from 'react';
import { useBossStore } from '../../stores/game/useBossStore';
import { getBoss, getBossPhasesFor, getWeakpointsFor } from '../../stores/game/useBossEditorStore';
import * as BossDirector from '../../game/bosses/BossDirector';
import { activeArena } from '../../game/bosses/BossArenaController';
import { useNowMs } from '../../game/combat/useNowMs';

// Boss debug tools (Batch F) — start/kill/reset, force/complete phase, expose/destroy weakpoint, damage/
// break-shield, freeze AI, export snapshot. God-mode mirrors combat god (handled by the God Mode panel).
const btn = 'rounded px-2 py-0.5 text-[11px] text-white';

export const BossDebugPanel = () => {
  useNowMs(250);
  useBossStore((s) => s.version);
  const runtime = useBossStore((s) => s.runtime);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const bossId = runtime?.bossDefinitionId ?? 'harbor_core_sentinel';
  const boss = getBoss(bossId);
  const phases = getBossPhasesFor(bossId);
  const weakpoints = getWeakpointsFor(bossId);

  return (
    <div className="pointer-events-auto fixed left-4 top-[8.5rem] z-40 w-64 rounded-xl border border-rose-500/30 bg-slate-900/90 p-3 text-slate-100 shadow-xl backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-300">👹 Boss Debug</div>
      <div className="mt-1 text-[10px] text-slate-400">{boss?.name ?? bossId} · {runtime?.status ?? 'inactive'}{runtime ? ` · ${runtime.activePhaseId ?? '—'}` : ''}{activeArena() ? '' : ''}</div>

      <div className="mt-2 flex flex-wrap gap-1">
        <button onClick={() => BossDirector.startBoss(bossId)} className={`${btn} bg-emerald-700 hover:bg-emerald-600`}>Start</button>
        <button onClick={() => BossDirector.debugKillBoss()} className={`${btn} bg-rose-800 hover:bg-rose-700`}>Kill</button>
        <button onClick={() => BossDirector.cleanup()} className={`${btn} bg-slate-700 hover:bg-slate-600`}>Reset</button>
        <button onClick={() => BossDirector.debugFreezeAi(!runtime?.debug?.freezeBossAi)} className={`${btn} ${runtime?.debug?.freezeBossAi ? 'bg-amber-700' : 'bg-slate-700 hover:bg-slate-600'}`}>Freeze AI</button>
      </div>

      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Force phase</div>
      <div className="flex flex-wrap gap-1">
        {phases.map((p) => <button key={p.id} onClick={() => BossDirector.debugForcePhase(p.id)} className={`${btn} bg-sky-800 hover:bg-sky-700`}>{p.name}</button>)}
      </div>

      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Weakpoints</div>
      <div className="flex flex-wrap gap-1">
        {weakpoints.map((w) => (
          <div key={w.id} className="flex gap-0.5">
            <button onClick={() => BossDirector.debugExposeWeakpoint(w.id)} className={`${btn} bg-violet-800 hover:bg-violet-700`} title="expose">👁 {w.displayName}</button>
            <button onClick={() => BossDirector.debugDestroyWeakpoint(w.id)} className={`${btn} bg-rose-900 hover:bg-rose-800`} title="destroy">✗</button>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <button onClick={() => BossDirector.debugBreakShield()} className={`${btn} bg-blue-800 hover:bg-blue-700`}>Break shield</button>
        <button onClick={() => BossDirector.debugDamageBoss(100)} className={`${btn} bg-orange-800 hover:bg-orange-700`}>−100 HP</button>
      </div>

      <button onClick={() => setSnapshot(JSON.stringify(runtime, null, 2))} className={`${btn} mt-2 bg-slate-700 hover:bg-slate-600`}>Export snapshot</button>
      {snapshot && <pre className="mt-1 max-h-28 overflow-auto rounded bg-slate-950/80 p-2 text-[9px] text-slate-300">{snapshot}</pre>}
    </div>
  );
};

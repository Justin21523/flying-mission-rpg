import { useAutoPlaytesterStore } from '../../stores/game/autoPlaytesterStore';
import { startAutoPlaytester, stopAutoPlaytester, resetAutoPlaytester } from '../../game/testing/autoPlaytesterRuntime';
import { autoStateLabel } from '../../game/testing/AutoPlaytesterStateMachine';

// Batch 13 — Debug-only AutoPlaytester panel. Run / stop / reset a full core-flow run and watch the live
// state, last action/assertion, elapsed time, failure reason, and step log.
const statusColor: Record<string, string> = {
  idle: 'text-slate-300', running: 'text-sky-300', completed: 'text-emerald-300', failed: 'text-rose-300', cancelled: 'text-amber-300',
};

export const AutoPlaytesterPanel = () => {
  const snap = useAutoPlaytesterStore((s) => s.snap);
  const enabled = useAutoPlaytesterStore((s) => s.enabled);

  return (
    <div className="pointer-events-auto fixed bottom-2 right-2 z-[60] w-72 rounded-lg border border-slate-700 bg-slate-950/90 p-2 font-mono text-[10px] text-slate-200 shadow-lg backdrop-blur">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-bold text-fuchsia-300">🤖 Auto Playtester</span>
        <span className={statusColor[snap.status] ?? 'text-slate-300'}>{snap.status}</span>
      </div>
      <Row k="enabled" v={enabled ? 'yes' : 'no'} />
      <Row k="phase" v={snap.currentPhase ? autoStateLabel(snap.currentPhase) : '—'} />
      <Row k="last action" v={snap.lastAction || '—'} />
      <Row k="last assert" v={snap.lastAssertion || '—'} />
      <Row k="elapsed" v={`${(snap.elapsedMs / 1000).toFixed(1)}s`} />
      {snap.failureReason && <div className="mt-0.5 text-rose-400">✗ {snap.failureReason}</div>}
      <div className="my-1 grid grid-cols-3 gap-1">
        <Btn label="▶ Run" onClick={startAutoPlaytester} />
        <Btn label="■ Stop" onClick={stopAutoPlaytester} />
        <Btn label="↺ Reset" onClick={resetAutoPlaytester} />
      </div>
      <div className="max-h-28 overflow-auto rounded bg-slate-900/60 p-1 text-[9px] text-slate-400">
        {snap.log.length === 0 ? <span>no steps yet</span> : snap.log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
};

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-center justify-between gap-2"><span className="text-slate-500">{k}</span><span className="truncate text-slate-100">{v}</span></div>
);
const Btn = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick} className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-200 hover:bg-slate-700">{label}</button>
);

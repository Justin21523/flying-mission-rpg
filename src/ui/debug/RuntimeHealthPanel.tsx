import { useEffect, useState } from 'react';
import { collectHealth, type HealthReport } from '../../game/diagnostics/RuntimeHealthMonitor';

// Batch 13 — on-screen runtime health (debug only). Polls the health monitor ~1 Hz.
const dot: Record<string, string> = { ok: 'text-emerald-300', warning: 'text-amber-300', error: 'text-rose-300' };

export const RuntimeHealthPanel = () => {
  const [report, setReport] = useState<HealthReport>(() => collectHealth());
  useEffect(() => {
    const id = setInterval(() => setReport(collectHealth()), 1000);
    return () => clearInterval(id);
  }, []);

  const exportJson = (): void => {
    const json = JSON.stringify(report, null, 2);
    try { void navigator.clipboard?.writeText(json); } catch { /* ignore */ }
    console.info('[runtime-health]', report);
  };

  return (
    <div className="pointer-events-auto fixed bottom-2 left-2 z-[60] w-64 rounded-lg border border-slate-700 bg-slate-950/90 p-2 font-mono text-[10px] text-slate-200 shadow-lg backdrop-blur">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-bold text-teal-300">🩺 Runtime Health</span>
        <span className={dot[report.status]}>{report.status}</span>
      </div>
      <Row k="phase" v={report.phase} />
      <Row k="stuck" v={`${report.stuckSeconds}s`} />
      <Row k="auto" v={report.autoStatus} />
      <Row k="save" v={report.save.lastSaveOk ? (report.save.lastSaveAt ? 'ok' : 'idle') : 'FAIL'} />
      <Row k="effects/pool" v={`${report.residual.effects}/${report.residual.poolActive}`} />
      <Row k="phaser" v={report.residual.phaserOpen ? 'open' : 'closed'} />
      {Object.entries(report.gauges).map(([k, v]) => <Row key={k} k={k} v={String(v)} />)}
      {report.warnings.map((w, i) => <div key={`w${i}`} className="text-amber-400">⚠ {w}</div>)}
      {report.errors.map((e, i) => <div key={`e${i}`} className="text-rose-400">✗ {e}</div>)}
      <button onClick={exportJson} className="mt-1 w-full rounded bg-slate-800 px-1.5 py-0.5 text-[9px] hover:bg-slate-700">Export diagnostics JSON</button>
    </div>
  );
};

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-center justify-between gap-2"><span className="text-slate-500">{k}</span><span className="truncate text-slate-100">{v}</span></div>
);

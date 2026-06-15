import { useState } from 'react';
import { useCinematicEffectStore } from '../../stores/game/useCinematicEffectStore';
import { vfxStats, previewVfx, cleanupAllVfx, snapshotVfx } from '../../game/vfx/CinematicVfxDebugTools';
import { useCinematicVfxStore } from '../../game/vfx/cinematicVfxRuntime';
import { useNowMs } from '../../game/combat/useNowMs';

// 🎬 Cinematic VFX debug panel (Batch F.5) — preview effects, watch active/pooled counts, cleanup all.
const btn = 'rounded px-2 py-0.5 text-[11px] text-white';

export const CinematicVfxDebugPanel = () => {
  useNowMs(250);
  useCinematicVfxStore((s) => s.version);
  const items = useCinematicEffectStore((s) => s.items);
  const [sel, setSel] = useState<string>(items[0]?.id ?? '');
  const [snap, setSnap] = useState<string | null>(null);
  const stats = vfxStats(sel);

  return (
    <div className="pointer-events-auto fixed right-4 top-[24rem] z-40 w-72 rounded-xl border border-violet-500/30 bg-slate-900/90 p-3 text-slate-100 shadow-xl backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-300">🎬 Cinematic VFX</div>
      <div className="mt-1 text-[10px] text-slate-400">active: {stats.activeEffects} · pooled: {stats.pooledInstances}/{stats.poolCapacity} · layers: {stats.layerCount}</div>
      <select value={sel} onChange={(e) => setSel(e.target.value)} className="mt-2 w-full rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-100">
        {items.slice(0, 120).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
      <div className="mt-2 flex flex-wrap gap-1">
        <button onClick={() => previewVfx(sel)} className={`${btn} bg-violet-700 hover:bg-violet-600`}>▶ Preview</button>
        <button onClick={cleanupAllVfx} className={`${btn} bg-rose-800 hover:bg-rose-700`}>Cleanup all</button>
        <button onClick={() => setSnap(snapshotVfx(sel))} className={`${btn} bg-slate-700 hover:bg-slate-600`}>Snapshot</button>
      </div>
      {snap && <pre className="mt-1 max-h-28 overflow-auto rounded bg-slate-950/80 p-2 text-[9px] text-slate-300">{snap}</pre>}
    </div>
  );
};

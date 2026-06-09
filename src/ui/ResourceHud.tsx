import { useEffect } from 'react';
import { usePoll } from './usePoll';
import { useResourceStore } from '../stores/resourceStore';
import { getResourceDefs } from '../stores/editorCollectibleStore';

// POLI — resource meters (bottom-left). One bar per resource (from the collectible economy): fills as you
// collect primitives; an `auto` resource fires its ability at the threshold, a key-armed resource shows
// "READY — <key>" and fires when you press that key. Polled, not per-frame subscribed. The key handler lives
// here so it is active whenever the HUD is mounted (Play Mode).
const keyLabel = (code?: string) => (code ? code.replace(/^Key/, '').replace(/^Digit/, '') : '?');

export const ResourceHud = () => {
  usePoll(120);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.repeat) return;
      for (const r of getResourceDefs()) {
        if (!r.auto && r.key && e.code === r.key && useResourceStore.getState().armed[r.id]) {
          e.preventDefault();
          useResourceStore.getState().spend(r.id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const resources = getResourceDefs();
  const amounts = useResourceStore.getState().amounts;
  const armed = useResourceStore.getState().armed;
  if (resources.length === 0) return null;

  return (
    <div className="pointer-events-none absolute bottom-6 left-4 z-[60] w-52 select-none space-y-1.5">
      {resources.map((r) => {
        const cur = amounts[r.id] ?? 0;
        const pct = Math.max(0, Math.min(100, (cur / (r.threshold || 1)) * 100));
        const ready = !!armed[r.id];
        return (
          <div key={r.id}>
            <div className="mb-0.5 flex items-center justify-between px-0.5 text-[10px] font-bold">
              <span style={{ color: r.color }}>{r.name}</span>
              {ready
                ? <span className="animate-pulse rounded px-1" style={{ background: `${r.color}33`, color: r.color }}>READY — {keyLabel(r.key)}</span>
                : <span className="tabular-nums text-slate-400">{Math.round(cur)}/{r.threshold}</span>}
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full border border-slate-600/70 bg-slate-900/70 shadow-inner">
              <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${pct}%`, background: r.color, boxShadow: ready ? `0 0 8px ${r.color}` : 'none' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

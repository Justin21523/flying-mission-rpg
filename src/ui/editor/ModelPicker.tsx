import { useMemo, useState } from 'react';
import { MODEL_ASSETS, MODEL_ASSET_LIST } from '../../data/modelLibrary';
import { inp } from './editorShared';

// Kit — reusable model picker over the auto-discovered models. A click opens an inline, live-filtering LIST
// (type to filter by name / category / id, click to pick) — not a native <select> you must open to see the
// filtered results. Used everywhere an entity bears a 3D model (NPC, trigger, path, boost pad, follower, …).
export const ModelPicker = ({ value, onChange, allowNone = true, noneLabel = '(none)' }: {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  allowNone?: boolean;
  noneLabel?: string;
}) => {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const total = MODEL_ASSET_LIST.length;

  const matches = useMemo(() => {
    const f = q.trim().toLowerCase();
    if (!f) return MODEL_ASSET_LIST;
    return MODEL_ASSET_LIST.filter((a) => a.label.toLowerCase().includes(f) || a.id.toLowerCase().includes(f) || a.category.toLowerCase().includes(f));
  }, [q]);

  const current = value ? MODEL_ASSETS[value] : undefined;
  const pick = (id: string | undefined) => { onChange(id); setOpen(false); setQ(''); };

  return (
    <div className="flex flex-col gap-1">
      <button onClick={() => setOpen((o) => !o)} className={inp + ' flex items-center justify-between text-left'} title={current?.label ?? noneLabel}>
        <span className="truncate">{current ? current.label : (value || noneLabel)}</span>
        <span className="ml-1 text-slate-500">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="rounded border border-slate-700 bg-slate-900/95 p-1">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={total ? `🔍 search ${total} models…` : 'no models — drop .glb into src/assets/models or public/models'} className={inp} />
          <div className="mt-1 max-h-48 overflow-y-auto">
            {allowNone && (
              <button onClick={() => pick(undefined)} className={`block w-full truncate rounded px-2 py-1 text-left text-[11px] ${!value ? 'bg-violet-700/30 text-violet-100' : 'text-slate-400 hover:bg-slate-800'}`}>{noneLabel}</button>
            )}
            {matches.map((a) => (
              <button key={a.id} onClick={() => pick(a.id)} className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] ${value === a.id ? 'bg-violet-700/30 text-violet-100' : 'text-slate-200 hover:bg-slate-800'}`}>
                <span className="flex-1 truncate">{a.label}</span>
                <span className="shrink-0 text-[9px] text-slate-500">{a.category}</span>
              </button>
            ))}
            {matches.length === 0 && <div className="px-2 py-1 text-[11px] text-slate-500">no match for “{q}”</div>}
          </div>
        </div>
      )}
    </div>
  );
};

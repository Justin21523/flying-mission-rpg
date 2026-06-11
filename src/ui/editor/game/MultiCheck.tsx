import { lbl } from '../editorShared';

// Compact multi-select checkbox grid (mission/NPC links, etc). Shared across the game editor tabs.
export const MultiCheck = ({ label, options, selected, onChange }: { label: string; options: { id: string; label: string }[]; selected: string[]; onChange: (ids: string[]) => void }) => {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div>
      <div className={lbl}>{label} {selected.length ? `(${selected.length})` : ''}</div>
      <div className="mt-1 grid max-h-28 grid-cols-2 gap-x-2 gap-y-0.5 overflow-y-auto rounded bg-slate-900/60 p-1.5">
        {options.map((o) => (
          <label key={o.id} className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} />
            <span className="truncate">{o.label}</span>
          </label>
        ))}
        {options.length === 0 && <span className="text-slate-500">none available</span>}
      </div>
    </div>
  );
};

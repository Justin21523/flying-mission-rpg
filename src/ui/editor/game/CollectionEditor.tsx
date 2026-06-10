import { useState } from 'react';
import type { ReactNode } from 'react';
import type { EditorCollectionStore } from '../../../stores/game/createEditorCollection';
import type { SourceConfidence } from '../../../types/sourceConfidence';
import { SOURCE_CONFIDENCES } from '../../../types/sourceConfidence';
import { Field, inp, lbl } from '../editorShared';

// Reusable Edit-Mode editor for any `{ id }` collection store: list (left) + add / duplicate / delete +
// an entity-specific field form (right, via renderFields). Each game data domain becomes a ~15-line tab.
interface CollectionEditorProps<T extends { id: string }> {
  title: string;
  store: EditorCollectionStore<T>;
  makeNew: () => T;
  getLabel: (item: T) => string;
  renderFields: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
}

export function CollectionEditor<T extends { id: string }>({
  title,
  store,
  makeNew,
  getLabel,
  renderFields,
}: CollectionEditorProps<T>) {
  const items = store((s) => s.items);
  const upsert = store((s) => s.upsert);
  const update = store((s) => s.update);
  const duplicate = store((s) => s.duplicate);
  const remove = store((s) => s.remove);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = items.find((i) => i.id === selectedId) ?? items[0] ?? null;
  const activeId = selected?.id ?? null;

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className={lbl}>
          {title} · {items.length}
        </div>
        <button
          onClick={() => {
            const it = makeNew();
            upsert(it);
            setSelectedId(it.id);
          }}
          className="rounded bg-emerald-700/30 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-700/50"
        >
          ➕ Add
        </button>
      </div>

      <div className="flex gap-3">
        <div className="max-h-[60vh] w-40 shrink-0 space-y-1 overflow-y-auto pr-1">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => setSelectedId(it.id)}
              className={`block w-full truncate rounded px-2 py-1 text-left ${
                it.id === activeId ? 'bg-violet-600/30 text-violet-100' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {getLabel(it)}
            </button>
          ))}
          {items.length === 0 && <div className="text-slate-500">None yet.</div>}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {selected ? (
            <>
              {renderFields(selected, (patch) => update(selected.id, patch))}
              <div className="flex items-center gap-1.5 border-t border-slate-800/60 pt-2">
                <button
                  onClick={() => {
                    const id = duplicate(selected.id);
                    if (id) setSelectedId(id);
                  }}
                  className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700"
                >
                  ⧉ Duplicate
                </button>
                <button
                  onClick={() => {
                    remove(selected.id);
                    setSelectedId(null);
                  }}
                  className="rounded bg-rose-700/20 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-700/30"
                >
                  🗑 Delete
                </button>
                <span className="ml-auto self-center text-[10px] text-slate-500">id: {selected.id}</span>
              </div>
            </>
          ) : (
            <div className="text-slate-500">Select or add an item.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── value-based field rows (presentational; reused by every game tab) ─────────────────────────────────
export const TextRow = ({
  label,
  value,
  onChange,
  area,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
}) => (
  <Field label={label}>
    {area ? (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={inp} />
    ) : (
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inp} />
    )}
  </Field>
);

export const NumRow = ({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) => (
  <Field label={label}>
    <input
      type="number"
      value={value}
      step={step}
      min={min}
      max={max}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={inp}
    />
  </Field>
);

export const SelectRow = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
}) => (
  <Field label={label}>
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inp}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </Field>
);

export const ColorRow = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <Field label={label}>
    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-16 rounded bg-slate-800" />
  </Field>
);

export const ConfidenceRow = ({
  value,
  onChange,
}: {
  value: SourceConfidence;
  onChange: (v: SourceConfidence) => void;
}) => (
  <SelectRow
    label="Source confidence"
    value={value}
    options={SOURCE_CONFIDENCES.map((c) => ({ value: c, label: c }))}
    onChange={(v) => onChange(v as SourceConfidence)}
  />
);

import { useMemo, useState } from 'react';
import { inp, lbl } from './editorShared';
import { downloadJson } from './downloadJson';
import { useEditorPresetStore, addPreset } from '../../stores/game/editorPresetStore';
import { useEditorVersionStore, removeVersion } from '../../stores/game/editorVersionStore';
import { copyFragment } from '../../game/editor/timelineClipboard';
import { restoreDoc, canRestoreDoc } from '../../game/editor/timelineDocRegistry';
import type { EditorPreset, PresetKind } from '../../types/game/editorPreset';

const btn = 'rounded px-1.5 py-0.5 text-[10px] disabled:opacity-30 disabled:cursor-not-allowed';
const fmt = (t: number) => new Date(t).toLocaleString();

// Cross-system browse/manage view for every saved preset + version snapshot. Presets are self-contained payloads
// (copy / export / rename / duplicate / delete / import); versions restore back into their source editor via the
// docKind→store registry. Complements the in-editor PresetBar (which authors them).
export const PresetLibraryPanel = () => {
  const presets = useEditorPresetStore((s) => s.items);
  const versions = useEditorVersionStore((s) => s.items);
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [q, setQ] = useState('');
  const [importText, setImportText] = useState('');
  const [msg, setMsg] = useState('');

  const kinds = useMemo(() => Array.from(new Set(presets.map((p) => p.kind))).sort(), [presets]);
  const shownPresets = presets
    .filter((p) => kindFilter === 'all' || p.kind === kindFilter)
    .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.kind.includes(q.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const pstore = useEditorPresetStore.getState();
  const rename = (p: EditorPreset) => { const n = window.prompt('Rename preset:', p.name); if (n != null) pstore.update(p.id, { name: n.trim() || p.name, updatedAt: Date.now() }); };
  const doImport = () => {
    try {
      const parsed = JSON.parse(importText) as Partial<EditorPreset>;
      if (!parsed || typeof parsed.kind !== 'string' || parsed.payload === undefined) { setMsg('✗ Not a preset (need kind + payload).'); return; }
      const id = addPreset(parsed.kind as PresetKind, parsed.name ?? 'imported', parsed.payload, { authoredFor: parsed.authoredFor, description: parsed.description, tags: parsed.tags });
      setImportText(''); setMsg(`✓ Imported "${parsed.name ?? 'imported'}" (${id}).`);
    } catch { setMsg('✗ Invalid JSON.'); }
  };

  // Versions grouped by document, newest first.
  const versionGroups = useMemo(() => {
    const by = new Map<string, typeof versions>();
    for (const v of versions) { const k = `${v.docKind}:${v.docId}`; (by.get(k) ?? by.set(k, []).get(k)!).push(v); }
    return Array.from(by.entries()).map(([key, list]) => ({ key, list: [...list].sort((a, b) => b.createdAt - a.createdAt) }));
  }, [versions]);

  return (
    <div className="space-y-3 text-slate-200">
      <h2 className="text-sm font-semibold text-amber-200">📚 Preset Library</h2>

      {/* ── Presets ── */}
      <section className="space-y-1.5 rounded border border-amber-700/40 bg-amber-950/10 p-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={lbl}>Presets · {presets.length}</span>
          <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} className={inp + ' h-6 w-44 py-0 text-[11px]'}>
            <option value="all">all kinds ({presets.length})</option>
            {kinds.map((k) => <option key={k} value={k}>{k} ({presets.filter((p) => p.kind === k).length})</option>)}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search…" className={inp + ' h-6 w-40 py-0 text-[11px]'} />
        </div>

        <div className="space-y-0.5">
          {shownPresets.map((p) => (
            <div key={p.id} className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900/50 px-1.5 py-0.5">
              <span className="font-mono text-[9px] text-amber-300/80">{p.kind}</span>
              <span className="flex-1 truncate text-[11px] text-slate-200">{p.name}</span>
              {p.authoredFor?.characterId && <span className="text-[9px] text-slate-500">{p.authoredFor.characterId}</span>}
              <span className="text-[9px] text-slate-600">{fmt(p.updatedAt)}</span>
              <button onClick={() => { copyFragment(p.kind, p.payload); setMsg(`✓ Copied "${p.name}" — paste in a matching editor.`); }} title="Copy to clipboard (paste in a matching editor's PresetBar)" className={`${btn} bg-slate-800 text-slate-200 hover:bg-slate-700`}>Copy</button>
              <button onClick={() => downloadJson(`preset-${p.kind}-${p.id}.json`, p)} title="Export JSON (downloaded + copied)" className={`${btn} bg-slate-800 text-slate-200 hover:bg-slate-700`}>Export</button>
              <button onClick={() => rename(p)} className={`${btn} bg-slate-800 text-slate-200 hover:bg-slate-700`}>Rename</button>
              <button onClick={() => pstore.duplicate(p.id)} title="Duplicate" className={`${btn} bg-slate-800 text-slate-300 hover:bg-slate-700`}>⧉</button>
              <button onClick={() => pstore.remove(p.id)} title="Delete" className={`${btn} bg-rose-800/40 text-rose-200 hover:bg-rose-800/60`}>✕</button>
            </div>
          ))}
          {shownPresets.length === 0 && <p className="text-[10px] text-slate-500">No presets{kindFilter !== 'all' || q ? ' match the filter' : ' yet — save some from an editor\'s ⧉ Preset bar'}.</p>}
        </div>

        <div className="flex items-start gap-1.5 border-t border-slate-800/60 pt-1.5">
          <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste a preset JSON to import…" className={inp + ' h-12 flex-1 text-[10px]'} />
          <button onClick={doImport} disabled={!importText.trim()} className={`${btn} bg-emerald-700/40 text-emerald-100 hover:bg-emerald-700/60`}>Import</button>
        </div>
      </section>

      {/* ── Versions ── */}
      <section className="space-y-1.5 rounded border border-sky-700/40 bg-sky-950/10 p-2">
        <span className={lbl}>Version snapshots · {versions.length}</span>
        {versionGroups.length === 0 && <p className="text-[10px] text-slate-500">No snapshots yet — use ⎙ Snapshot in an editor.</p>}
        {versionGroups.map(({ key, list }) => (
          <div key={key} className="rounded border border-slate-800 bg-slate-900/40 p-1">
            <div className="mb-0.5 flex items-center gap-1 text-[10px] text-slate-400"><span className="font-mono text-sky-300/80">{list[0].docKind}</span><span className="truncate">{list[0].docId}</span><span className="ml-auto text-slate-600">{list.length}</span></div>
            {list.map((v) => (
              <div key={v.id} className="flex items-center gap-1 text-[10px]">
                <span className="font-mono text-slate-500">{v.auto ? '·' : '★'}</span>
                <span className="flex-1 truncate text-slate-300">{v.label}</span>
                <span className="text-slate-600">{fmt(v.createdAt)}</span>
                <button onClick={() => { if (restoreDoc(v.docKind, v.docId, v.payload)) setMsg(`✓ Restored "${v.label}" into ${v.docKind}.`); else setMsg(`✗ No restore handler for "${v.docKind}".`); }} disabled={!canRestoreDoc(v.docKind)} title={canRestoreDoc(v.docKind) ? 'Restore this version into its editor' : 'No restore handler for this doc kind'} className={`${btn} bg-sky-700/40 text-sky-100 hover:bg-sky-700/60`}>Restore</button>
                <button onClick={() => removeVersion(v.id)} title="Delete" className={`${btn} bg-rose-800/40 text-rose-200 hover:bg-rose-800/60`}>✕</button>
              </div>
            ))}
          </div>
        ))}
      </section>

      {msg && <p className="text-[10px] text-slate-400">{msg}</p>}
    </div>
  );
};

import { useState } from 'react';
import { inp, lbl } from '../editorShared';
import type { PresetKind, EditorPreset } from '../../../types/game/editorPreset';
import { addPreset, useEditorPresetStore } from '../../../stores/game/editorPresetStore';
import { snapshotDoc, removeVersion, useEditorVersionStore } from '../../../stores/game/editorVersionStore';
import { copyFragment, canPaste, takeFragmentPayload } from '../../../game/editor/timelineClipboard';

// Shared editor strip: Copy / Paste / Save-as-preset / Insert-preset / Snapshot / History. System-agnostic — it
// operates only on opaque events (an effect, a keyframe, …) + a whole-doc snapshot, via the callbacks an editor
// passes in. The transformation EffectsV2Editor is the first consumer; flight + skills reuse it unchanged later.
export interface PresetBarProps {
  docKind: string; // 'transformation'
  docId: string;
  docLabel: string;
  characterId?: string;
  eventPresetKind: PresetKind; // a single event, e.g. 'transformation.effect'
  fullPresetKind?: PresetKind; // OPTIONAL: the whole event list, e.g. 'transformation.full'. Omit to hide "Save all".
  eventNoun: string; // word shown on buttons, e.g. 'effect'
  events: unknown[];
  setEvents: (next: unknown[]) => void;
  selectedEvent: unknown | null;
  selectedName?: string;
  rekeyEvent: (e: unknown) => unknown;
  getDoc: () => unknown; // whole-document snapshot payload (for version history)
  applyDoc: (doc: unknown) => void; // restore a version back into the document
  showVersions?: boolean; // default true; set false on a secondary bar for the same doc (versions appear once)
}

const btn = 'rounded px-1.5 py-0.5 text-[10px] disabled:opacity-30 disabled:cursor-not-allowed';

export const PresetBar = (p: PresetBarProps) => {
  const presets = useEditorPresetStore((s) => s.items);
  const versions = useEditorVersionStore((s) => s.items);
  const [pick, setPick] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);

  const showVersions = p.showVersions !== false;
  const kindPresets = presets.filter((pr) => pr.kind === p.eventPresetKind || (p.fullPresetKind != null && pr.kind === p.fullPresetKind));
  const docVersions = versions
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => v.docKind === p.docKind && v.docId === p.docId)
    .sort((a, b) => b.v.createdAt - a.v.createdAt || b.i - a.i)
    .map(({ v }) => v);

  const pasteEnabled = canPaste(p.eventPresetKind);

  const doCopy = () => { if (p.selectedEvent) copyFragment(p.eventPresetKind, p.selectedEvent); };
  const doPaste = () => {
    const frag = takeFragmentPayload(p.eventPresetKind);
    if (frag != null) p.setEvents([...p.events, p.rekeyEvent(frag)]);
  };
  const doSaveEvent = () => {
    if (!p.selectedEvent) return;
    const name = window.prompt(`Save ${p.eventNoun} as preset — name:`, p.selectedName ?? p.eventNoun);
    if (name == null) return;
    addPreset(p.eventPresetKind, name, p.selectedEvent, { authoredFor: { characterId: p.characterId } });
  };
  const doSaveAll = () => {
    if (p.events.length === 0 || p.fullPresetKind == null) return;
    const name = window.prompt(`Save whole timeline (${p.events.length} ${p.eventNoun}s) as preset — name:`, p.docLabel);
    if (name == null) return;
    addPreset(p.fullPresetKind, name, p.events, { authoredFor: { characterId: p.characterId } });
  };
  const doInsert = () => {
    const pr = kindPresets.find((x) => x.id === pick);
    if (!pr) return;
    if (p.fullPresetKind != null && pr.kind === p.fullPresetKind) {
      const list = Array.isArray(pr.payload) ? (pr.payload as unknown[]) : [];
      p.setEvents([...p.events, ...list.map(p.rekeyEvent)]);
    } else {
      p.setEvents([...p.events, p.rekeyEvent(pr.payload)]);
    }
  };
  const doSnapshot = () => {
    const label = window.prompt('Snapshot label:', `${p.docLabel} ${new Date().toLocaleTimeString()}`);
    if (label == null) return;
    snapshotDoc(p.docKind, p.docId, p.getDoc(), label, false);
    setShowHistory(true);
  };
  const presetLabel = (pr: EditorPreset) => `${p.fullPresetKind != null && pr.kind === p.fullPresetKind ? '◫' : '◦'} ${pr.name}`;

  return (
    <div className="space-y-1 rounded border border-amber-700/40 bg-amber-950/10 p-1.5">
      <div className="flex flex-wrap items-center gap-1">
        <span className={lbl}>⧉ Preset</span>
        <button onClick={doCopy} disabled={!p.selectedEvent} title={`Copy selected ${p.eventNoun} to clipboard`} className={`${btn} bg-slate-800 text-slate-200 hover:bg-slate-700`}>Copy</button>
        <button onClick={doPaste} disabled={!pasteEnabled} title={`Paste ${p.eventNoun} from clipboard`} className={`${btn} bg-slate-800 text-slate-200 hover:bg-slate-700`}>Paste</button>
        <button onClick={doSaveEvent} disabled={!p.selectedEvent} title={`Save selected ${p.eventNoun} as a reusable preset`} className={`${btn} bg-amber-700/40 text-amber-100 hover:bg-amber-700/60`}>Save {p.eventNoun}</button>
        {p.fullPresetKind != null && <button onClick={doSaveAll} disabled={p.events.length === 0} title="Save the whole timeline as a preset" className={`${btn} bg-amber-700/40 text-amber-100 hover:bg-amber-700/60`}>Save all</button>}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <select value={pick} onChange={(e) => setPick(e.target.value)} className={inp + ' h-6 flex-1 py-0 text-[11px]'}>
          <option value="">{kindPresets.length ? `Insert preset… (${kindPresets.length})` : '(no presets yet)'}</option>
          {kindPresets.map((pr) => <option key={pr.id} value={pr.id}>{presetLabel(pr)}</option>)}
        </select>
        <button onClick={doInsert} disabled={!pick} title="Append the chosen preset (ids re-keyed, safe for any character)" className={`${btn} bg-emerald-700/40 text-emerald-100 hover:bg-emerald-700/60`}>Insert</button>
        {showVersions && <button onClick={doSnapshot} title="Save a named version of this document" className={`${btn} bg-sky-700/40 text-sky-100 hover:bg-sky-700/60`}>⎙ Snapshot</button>}
        {showVersions && <button onClick={() => setShowHistory((v) => !v)} title="Version history" className={`${btn} bg-slate-800 text-slate-200 hover:bg-slate-700`}>History {docVersions.length ? `(${docVersions.length})` : ''}</button>}
      </div>

      {showVersions && showHistory && (
        <div className="space-y-0.5 rounded border border-sky-800/40 bg-slate-950/40 p-1">
          {docVersions.length === 0 && <p className="text-[10px] text-slate-500">No snapshots yet — click ⎙ Snapshot to save one.</p>}
          {docVersions.map((v) => (
            <div key={v.id} className="flex items-center gap-1 text-[10px]">
              <span className="font-mono text-slate-500">{v.auto ? '·' : '★'}</span>
              <span className="flex-1 truncate text-slate-300">{v.label}</span>
              <span className="text-slate-600">{new Date(v.createdAt).toLocaleTimeString()}</span>
              <button onClick={() => p.applyDoc(v.payload)} title="Restore this version" className={`${btn} bg-sky-700/40 text-sky-100 hover:bg-sky-700/60`}>Restore</button>
              <button onClick={() => removeVersion(v.id)} title="Delete this version" className={`${btn} bg-rose-800/40 text-rose-200 hover:bg-rose-800/60`}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

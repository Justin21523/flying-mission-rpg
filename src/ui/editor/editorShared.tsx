/* eslint-disable react-refresh/only-export-components -- shared editor form helpers (mixed exports) */
import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { getAllAreas } from '../../data/areas';
import { SEED_ITEMS } from '../../data/items';
import { SEED_NPCS } from '../../data/npcs';
import { useQuestStore } from '../../stores/questStore';
import { useEditorQuestStore } from '../../stores/editorQuestStore';
import { useEditorNpcStore } from '../../stores/editorNpcStore';
import { useEditorWorldStore } from '../../stores/editorWorldStore';
import { useEditorPathStore } from '../../stores/editorPathStore';
import { useEditorAnimationStore } from '../../stores/editorAnimationStore';
import { useEditorSurfaceStore } from '../../stores/editorSurfaceStore';
import { listDialogueTreeIds } from '../../game/dialogue/dialogueRegistry';
import { focusCameraOn } from '../../game/edit/cameraFocus';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import type { IdOption } from './idPickers';

// Kit — shared form bits for the editor sub-panels (keeps each editor small). Ported from the original
// triggerEditorShared, with kit dropdown sources (no generated-area / yokai layers).
export const inp = 'w-full rounded bg-slate-800 px-2 py-1 text-xs text-slate-100';
export const lbl = 'text-[10px] font-semibold uppercase tracking-wide text-slate-400';

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="flex flex-col gap-0.5"><span className={lbl}>{label}</span>{children}</label>
);

export const Check = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-1.5 text-xs text-slate-300">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-sky-500" /> {label}
  </label>
);

// Jump the edit camera to a 3D object (and optionally select it). Uses the focusCameraOn bus consumed by
// FollowCamera (and the transformation orbit cam). Put on any object row that has a world position.
export const FocusButton = ({ position, objKey, title = 'Focus the camera on this object' }: { position: [number, number, number]; objKey?: string; title?: string }) => (
  <button
    title={title}
    onClick={() => { focusCameraOn(position[0], position[1], position[2]); if (objKey) useSceneEditStore.getState().requestSelect(objKey); }}
    className="rounded bg-sky-700/30 px-2 py-0.5 text-[10px] text-sky-100 hover:bg-sky-700/50"
  >
    🎯 Focus
  </button>
);

// Up/down reorder buttons for an ordered list item (disabled at the ends).
export const MoveButtons = ({ index, count, onMove }: { index: number; count: number; onMove: (dir: -1 | 1) => void }) => (
  <span className="inline-flex gap-0.5">
    <button onClick={() => onMove(-1)} disabled={index <= 0} title="Move up" className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700 disabled:opacity-30">▲</button>
    <button onClick={() => onMove(1)} disabled={index >= count - 1} title="Move down" className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700 disabled:opacity-30">▼</button>
  </span>
);

export const csv = (a?: string[]) => (a ?? []).join(', ');
export const parseCsv = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

// --- live id / option sources (for IdSelect / IdMultiPicker dropdowns) ---------------------------------
// Subscribe to the editable world areas so dropdowns stay live — areas added/renamed in the 🗺 World tab
// appear immediately (e.g. portal targets), not just the ones present at mount.
export function useAreaIds(): string[] {
  useEditorWorldStore((s) => s.areas); // re-render when areas change
  return getAllAreas().map((a) => a.id);
}
export function useAreaOptions(): IdOption[] {
  useEditorWorldStore((s) => s.areas); // re-render when areas change
  return getAllAreas().map((a) => ({ id: a.id, label: a.name }));
}

export function useQuestIds(): string[] {
  const quests = useQuestStore((s) => s.quests);
  return useMemo(() => Object.keys(quests), [quests]);
}
export function useQuestOptions(): IdOption[] {
  const quests = useQuestStore((s) => s.quests);
  return useMemo(() => Object.values(quests).map((q) => ({ id: q.id, label: q.title || q.id })), [quests]);
}

export function useItemOptions(): IdOption[] {
  const editorItems = useEditorQuestStore((s) => s.items);
  return useMemo(() => {
    const seed = SEED_ITEMS.map((i) => ({ id: i.id, label: i.name }));
    const ed = editorItems.map((i) => ({ id: i.id, label: i.name }));
    const seen = new Set<string>();
    return [...ed, ...seed].filter((o) => (seen.has(o.id) ? false : (seen.add(o.id), true)));
  }, [editorItems]);
}

export function useNpcOptions(): IdOption[] {
  const editorNpcs = useEditorNpcStore((s) => s.addedNpcs);
  return useMemo(() => {
    const seed = SEED_NPCS.map((n) => ({ id: n.id, label: n.name }));
    const ed = editorNpcs.map((n) => ({ id: n.id, label: n.displayName }));
    const seen = new Set<string>();
    return [...ed, ...seed].filter((o) => (seen.has(o.id) ? false : (seen.add(o.id), true)));
  }, [editorNpcs]);
}

export function usePathOptions(): IdOption[] {
  const paths = useEditorPathStore((s) => s.paths);
  return useMemo(() => paths.map((p) => ({ id: p.id, label: p.name || p.id })), [paths]);
}
export function useAnimationOptions(): IdOption[] {
  const defs = useEditorAnimationStore((s) => s.definitions);
  return useMemo(() => defs.map((d) => ({ id: d.id, label: d.displayName || d.id })), [defs]);
}
export function useSurfaceOptions(): IdOption[] {
  const surfaces = useEditorSurfaceStore((s) => s.surfaces);
  return useMemo(() => surfaces.map((s) => ({ id: s.id, label: s.name || s.id })), [surfaces]);
}

export function useDialogueOptions(): IdOption[] {
  const trees = useEditorNpcStore((s) => s.dialogueTrees); // re-list when editor trees change
  // eslint-disable-next-line react-hooks/exhaustive-deps -- listDialogueTreeIds reads the store via getState; re-run on `trees`
  return useMemo(() => listDialogueTreeIds().map((t) => ({ id: t.id, label: t.source === 'editor' ? `✎ ${t.id}` : t.id })), [trees]);
}

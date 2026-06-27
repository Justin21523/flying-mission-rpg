import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { EditorVersion } from '../../types/game/editorVersion';

// Per-document named version history (snapshot + restore). Built on createEditorCollection like every other
// store, so it persists to localStorage and round-trips through project Export/Import. All documents' versions
// live in one list; helpers filter/trim per (docKind, docId).
export const useEditorVersionStore = createEditorCollection<EditorVersion>({
  storageKey: 'aero-editor-versions-v1',
  seed: [],
  makeId: () => `ver_${nanoid(6)}`,
});

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

// Keep all manual snapshots; cap auto-checkpoints per document so localStorage never grows unbounded
// (mirrors editorUndoStore's LIMIT trimming).
const MAX_AUTO_PER_DOC = 25;

// Take a snapshot of one document. `payload` is deep-cloned. Returns the new version id.
export function snapshotDoc<T>(docKind: string, docId: string, payload: T, label: string, auto = false): string {
  const id = `ver_${nanoid(6)}`;
  useEditorVersionStore.getState().upsert({
    id,
    docKind,
    docId,
    label: label.trim() || (auto ? 'checkpoint' : 'snapshot'),
    createdAt: Date.now(),
    auto,
    payload: clone(payload),
  });
  // Trim excess auto-checkpoints for this document only.
  const items = useEditorVersionStore.getState().items;
  const autos = items
    .filter((v) => v.docKind === docKind && v.docId === docId && v.auto)
    .sort((a, b) => a.createdAt - b.createdAt);
  if (autos.length > MAX_AUTO_PER_DOC) {
    const drop = new Set(autos.slice(0, autos.length - MAX_AUTO_PER_DOC).map((v) => v.id));
    useEditorVersionStore.getState().importState({ items: items.filter((v) => !drop.has(v.id)) });
  }
  return id;
}

// Versions for one document, newest first. Ties on createdAt (two snapshots in the same millisecond) break by
// insertion order — items are stored append-only, so a higher array index is the newer snapshot.
export function listVersions(docKind: string, docId: string): EditorVersion[] {
  return useEditorVersionStore
    .getState()
    .items.map((v, i) => ({ v, i }))
    .filter(({ v }) => v.docKind === docKind && v.docId === docId)
    .sort((a, b) => b.v.createdAt - a.v.createdAt || b.i - a.i)
    .map(({ v }) => v);
}

export function getVersion(id: string): EditorVersion | undefined {
  return useEditorVersionStore.getState().items.find((v) => v.id === id);
}

export function removeVersion(id: string): void {
  useEditorVersionStore.getState().remove(id);
}

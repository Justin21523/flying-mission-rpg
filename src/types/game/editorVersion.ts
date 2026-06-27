// A named, restorable snapshot of ONE editor document (one transformation def, one flight phase, …). Separate
// from the global Ctrl+Z undo (editorUndoStore): versions are explicit, per-document, persistent and exportable.
// Because a snapshot is a single document (not the whole project), it stays small. `payload` is a deep clone of
// the document at snapshot time; restoring writes it back through the document's normal store update path.
export interface EditorVersion<T = unknown> {
  id: string;
  docKind: string; // 'transformation' | 'flightPhase' | 'skill' | …
  docId: string; // which definition/phase/skill this version belongs to
  label: string; // user note, or an auto-checkpoint reason
  createdAt: number;
  auto: boolean; // auto-checkpoint vs manual save (autos are trimmed; manuals are kept)
  payload: T;
}

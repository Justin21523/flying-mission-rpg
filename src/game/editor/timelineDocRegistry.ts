import { useEditorTransformationStore } from '../../stores/game/editorTransformationStore';
import { useFlightPhaseStore } from '../../stores/game/flightPhaseStore';
import { useEditorCombatSkillStore } from '../../stores/game/editorCombatStore';

// Maps a version snapshot's `docKind` back to the store write that restores it — so the global Preset Library
// panel can restore a version without knowing each system's internals (the per-editor PresetBar restores
// in-context via its own applyDoc; this is the out-of-context equivalent). Payload is the whole-doc snapshot.
type RestoreFn = (docId: string, payload: unknown) => void;

const RESTORERS: Record<string, RestoreFn> = {
  transformation: (id, p) => useEditorTransformationStore.getState().update(id, p as never),
  flightPhase: (id, p) => useFlightPhaseStore.getState().updatePhase(id, p as never),
  skill: (id, p) => useEditorCombatSkillStore.getState().update(id, p as never),
};

export function canRestoreDoc(docKind: string): boolean {
  return docKind in RESTORERS;
}

export function restoreDoc(docKind: string, docId: string, payload: unknown): boolean {
  const fn = RESTORERS[docKind];
  if (!fn) return false;
  fn(docId, payload);
  return true;
}

import { useSceneEditStore } from '../../stores/sceneEditStore';
import { useEditorBaseLayoutStore } from '../../stores/game/editorBaseLayoutStore';
import { useEditorExteriorStore } from '../../stores/game/editorExteriorStore';

// Wire gizmo Shift+D (duplicate) and Del (delete) to the DATA stores for the game's editable layout parts
// (base + exterior), including multi-selection — so batch duplicate/delete work like move already does
// (which the kit's EditableObject + SceneEditorGizmo handle). Falls through to the kit default otherwise.
interface PartOps {
  duplicate: (id: string) => string | null;
  remove: (id: string) => void;
}
const BASE = 'base#structure#';
const EXT = 'exterior#structure#';

function opsFor(key: string): { ops: PartOps; id: string } | null {
  if (key.startsWith(BASE)) return { ops: useEditorBaseLayoutStore.getState(), id: key.slice(BASE.length) };
  if (key.startsWith(EXT)) return { ops: useEditorExteriorStore.getState(), id: key.slice(EXT.length) };
  return null;
}

function selectedKeys(): string[] {
  const s = useSceneEditStore.getState();
  const keys: string[] = [];
  if (s.selectedKey) keys.push(s.selectedKey);
  for (const e of s.extraSelected) if (!keys.includes(e.key)) keys.push(e.key);
  return keys;
}

// Returns true if it handled a game-layout selection (so the caller skips the kit default).
export function duplicateGameSelection(): boolean {
  const targets = selectedKeys().map(opsFor).filter((t): t is { ops: PartOps; id: string } => t !== null);
  if (targets.length === 0) return false;
  for (const t of targets) t.ops.duplicate(t.id);
  return true;
}

export function deleteGameSelection(): boolean {
  const targets = selectedKeys().map(opsFor).filter((t): t is { ops: PartOps; id: string } => t !== null);
  if (targets.length === 0) return false;
  for (const t of targets) t.ops.remove(t.id);
  useSceneEditStore.getState().clearSelection();
  return true;
}

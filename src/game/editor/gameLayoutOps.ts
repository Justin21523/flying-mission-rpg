import { useSceneEditStore } from '../../stores/sceneEditStore';
import { useEditorBaseLayoutStore } from '../../stores/game/editorBaseLayoutStore';
import { useEditorExteriorStore } from '../../stores/game/editorExteriorStore';
import { useEditorDestinationStore } from '../../stores/game/editorDestinationStore';
import { useEditorNpcStore } from '../../stores/editorNpcStore';
import { useEditorLandmarkStore } from '../../stores/editorLandmarkStore';
import { useEditorPortalStore, getPortal } from '../../stores/editorPortalStore';
import { useEditorWorldStore } from '../../stores/editorWorldStore';
import { useEditorTrafficStore } from '../../stores/editorTrafficStore';
import { useEditorTriggerStore } from '../../stores/editorTriggerStore';
import { useEditorTransformationStore } from '../../stores/game/editorTransformationStore';
import type { ModelSlot, TransformationDefinition } from '../../types/game/transformation';

// Wire gizmo Shift+D (duplicate) and Del (delete) to the DATA stores for the game's editable layout parts
// (base + exterior), including multi-selection — so batch duplicate/delete work like move already does
// (which the kit's EditableObject + SceneEditorGizmo handle). Falls through to the kit default otherwise.
interface PartOps {
  duplicate: (id: string) => string | null;
  remove: (id: string) => void;
}
const BASE = 'base#structure#';
const EXT = 'exterior#structure#';
const DST = 'destination#structure#';
const ADDED_SETPIECE = /^(.+)#setpiece#added_(.+)$/;

function opsFor(key: string): { ops: PartOps; id: string } | null {
  if (key.startsWith(BASE)) return { ops: useEditorBaseLayoutStore.getState(), id: key.slice(BASE.length) };
  if (key.startsWith(EXT)) return { ops: useEditorExteriorStore.getState(), id: key.slice(EXT.length) };
  if (key.startsWith(DST)) return { ops: useEditorDestinationStore.getState(), id: key.slice(DST.length) };
  return null;
}

function selectedKeys(): string[] {
  const s = useSceneEditStore.getState();
  const keys: string[] = [];
  if (s.selectedKey) keys.push(s.selectedKey);
  for (const e of s.extraSelected) if (!keys.includes(e.key)) keys.push(e.key);
  return keys;
}

function clearSceneEditKey(key: string): void {
  const store = useSceneEditStore.getState();
  store.resetKey(key);
  useSceneEditStore.setState((s) => {
    const deleted = { ...s.deleted };
    delete deleted[key];
    return { deleted };
  });
}

// Returns true if it handled a game-layout selection (so the caller skips the kit default).
export function duplicateGameSelection(): boolean {
  const targets = selectedKeys().map(opsFor).filter((t): t is { ops: PartOps; id: string } => t !== null);
  if (targets.length === 0) return false;
  for (const t of targets) t.ops.duplicate(t.id);
  return true;
}

export function deleteGameSelection(): boolean {
  const keys = selectedKeys();
  let handled = false;
  for (const key of keys) {
    const target = opsFor(key);
    if (target) {
      target.ops.remove(target.id);
      clearSceneEditKey(key);
      handled = true;
      continue;
    }
    if (deleteStoreBackedSceneSelection(key)) handled = true;
  }
  if (!handled) return false;
  useSceneEditStore.getState().clearSelection();
  return true;
}

function deleteStoreBackedSceneSelection(key: string): boolean {
  const [area, kind, id] = key.split('#');
  if (!area || !kind || !id) return false;

  const addedMatch = key.match(ADDED_SETPIECE);
  if (addedMatch) {
    const addedId = addedMatch[2];
    useSceneEditStore.setState((s) => ({ added: s.added.filter((piece) => piece.id !== addedId) }));
    clearSceneEditKey(key);
    return true;
  }

  if (area === 'transform' && kind === 'structure') return deleteTransformationSelection(key, id);

  if (kind === 'npc') {
    const store = useEditorNpcStore.getState();
    if (!store.addedNpcs.some((npc) => npc.id === id)) return false;
    store.removeNpc(id);
    clearSceneEditKey(key);
    return true;
  }

  if (kind === 'landmark') {
    const landmarks = useEditorLandmarkStore.getState();
    if (landmarks.landmarks.some((landmark) => landmark.id === id)) {
      landmarks.removeLandmark(id);
      clearSceneEditKey(key);
      return true;
    }
    if (getPortal(id)) {
      useEditorPortalStore.getState().removePortal(id);
      clearSceneEditKey(key);
      return true;
    }
    const world = useEditorWorldStore.getState();
    if (world.areas.some((worldArea) => worldArea.id === area && (worldArea.points ?? []).some((point) => point.id === id))) {
      world.removePoint(area, id);
      clearSceneEditKey(key);
      return true;
    }
  }

  if (kind === 'trigger') {
    const traffic = useEditorTrafficStore.getState();
    if (traffic.signals.some((signal) => signal.id === id)) {
      traffic.removeSignal(id);
      clearSceneEditKey(key);
      return true;
    }
    const triggers = useEditorTriggerStore.getState();
    if (triggers.triggers.some((trigger) => trigger.id === id)) {
      triggers.removeTrigger(id);
      clearSceneEditKey(key);
      return true;
    }
  }

  return false;
}

function updateTransformation(id: string, patcher: (def: TransformationDefinition) => TransformationDefinition): boolean {
  const store = useEditorTransformationStore.getState();
  const def = store.items.find((item) => item.id === id);
  if (!def) return false;
  store.upsert(patcher(def));
  return true;
}

function deleteTransformationSelection(key: string, id: string): boolean {
  const [timelineId, token, ...rest] = id.split('__');
  if (!timelineId || !token) return false;
  const targetId = rest.join('__');

  const handled = (() => {
    if (token === 'root') {
      return updateTransformation(timelineId, (def) => ({ ...def, rootPosition: undefined, rootRotation: undefined, modelScale: undefined }));
    }
    if (token === 'model_slot') {
      const slot = targetId as ModelSlot;
      return updateTransformation(timelineId, (def) => {
        const modelSlotOffsets = { ...(def.modelSlotOffsets ?? {}) };
        delete modelSlotOffsets[slot];
        return { ...def, modelSlotOffsets };
      });
    }
    if (token === 'stage_model' || token === 'stage_move' || token === 'part_move') {
      return updateTransformation(timelineId, (def) => ({ ...def, stages: def.stages.filter((stage) => stage.id !== targetId) }));
    }
    if (token === 'effect') {
      return updateTransformation(timelineId, (def) => ({ ...def, effectTracks: (def.effectTracks ?? []).filter((effect) => effect.id !== targetId) }));
    }
    if (token === 'camera_shot' || token === 'camera_look') {
      return updateTransformation(timelineId, (def) => ({ ...def, cameraShots: (def.cameraShots ?? []).filter((shot) => shot.id !== targetId) }));
    }
    return updateTransformation(timelineId, (def) => ({ ...def, parts: (def.parts ?? []).filter((part) => part.key !== token) }));
  })();

  if (handled) clearSceneEditKey(key);
  return handled;
}

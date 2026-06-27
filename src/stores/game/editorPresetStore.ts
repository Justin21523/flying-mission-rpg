import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { EditorPreset, PresetKind } from '../../types/game/editorPreset';

// One shared library for every kind of editor preset (transformation effects, flight keyframes, skills, …),
// filtered by `kind` in the UI. Built on the same createEditorCollection factory as all other authored content,
// so it inherits duplicate/remove/reorder/importState + localStorage persistence and round-trips through the
// project Export/Import (registered as a domain in editorContentRegistry).
export const useEditorPresetStore = createEditorCollection<EditorPreset>({
  storageKey: 'aero-editor-presets-v1',
  seed: [], // presets are entirely user-authored — nothing ships
  makeId: () => `pre_${nanoid(6)}`,
});

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

// Save a fragment as a reusable preset. Returns the new preset id.
export function addPreset<T>(
  kind: PresetKind,
  name: string,
  payload: T,
  extra?: { description?: string; tags?: string[]; authoredFor?: EditorPreset['authoredFor'] },
): string {
  const id = `pre_${nanoid(6)}`;
  const now = Date.now();
  useEditorPresetStore.getState().upsert({
    id,
    kind,
    name: name.trim() || kind,
    description: extra?.description,
    tags: extra?.tags,
    authoredFor: extra?.authoredFor,
    payloadVersion: 1,
    createdAt: now,
    updatedAt: now,
    payload: clone(payload),
  });
  return id;
}

// Presets of a given kind, newest first.
export function listPresets(kind: PresetKind): EditorPreset[] {
  return useEditorPresetStore
    .getState()
    .items.filter((p) => p.kind === kind)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getPreset(id: string): EditorPreset | undefined {
  return useEditorPresetStore.getState().items.find((p) => p.id === id);
}

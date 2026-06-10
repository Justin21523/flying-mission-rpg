import { useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { useEditorLocationStore } from '../../stores/game/editorLocationStore';
import { useEditorRouteStore } from '../../stores/game/editorRouteStore';
import { useEditorMissionStore } from '../../stores/game/editorMissionStore';
import { useEditorGameNpcStore } from '../../stores/game/editorGameNpcStore';
import { useEditorTransformationStore } from '../../stores/game/editorTransformationStore';
import { useEditorBaseLayoutStore } from '../../stores/game/editorBaseLayoutStore';

// One idempotent call at boot: ensure every authored-content store has its seed (without clobbering user
// edits — mergeMissingFromSeed only adds missing ids). Safe to run on every boot / existing save.
export function seedGameContent(): void {
  useEditorCharacterStore.getState().mergeMissingFromSeed();
  useEditorLocationStore.getState().mergeMissingFromSeed();
  useEditorRouteStore.getState().mergeMissingFromSeed();
  useEditorMissionStore.getState().mergeMissingFromSeed();
  useEditorGameNpcStore.getState().mergeMissingFromSeed();
  useEditorTransformationStore.getState().mergeMissingFromSeed();
  useEditorBaseLayoutStore.getState().mergeMissingFromSeed();
}

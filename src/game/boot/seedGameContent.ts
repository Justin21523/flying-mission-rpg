import { useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { useEditorLocationStore } from '../../stores/game/editorLocationStore';
import { useEditorRouteStore } from '../../stores/game/editorRouteStore';
import { useEditorMissionStore } from '../../stores/game/editorMissionStore';
import { useEditorGameNpcStore } from '../../stores/game/editorGameNpcStore';
import { useEditorTransformationStore } from '../../stores/game/editorTransformationStore';
import { useEditorBaseLayoutStore } from '../../stores/game/editorBaseLayoutStore';
import { useEditorExteriorStore } from '../../stores/game/editorExteriorStore';
import { useEditorPathStore, getPath } from '../../stores/editorPathStore';
import { FLIGHT_PATH, FLIGHT_PATH_ID } from '../../data/game/flightPath';

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
  useEditorExteriorStore.getState().mergeMissingFromSeed();

  // Seed the guided flight path into POLI's editorPathStore (so the 🛣 Tracks tab + node gizmos edit it).
  if (!getPath(FLIGHT_PATH_ID)) {
    useEditorPathStore.setState((s) => ({ paths: [...s.paths, JSON.parse(JSON.stringify(FLIGHT_PATH)) as typeof FLIGHT_PATH] }));
    useEditorPathStore.getState().updatePath(FLIGHT_PATH_ID, {}); // triggers persist
  }
}


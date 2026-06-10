import { useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { useEditorLocationStore } from '../../stores/game/editorLocationStore';
import { useEditorRouteStore } from '../../stores/game/editorRouteStore';
import { useEditorMissionStore } from '../../stores/game/editorMissionStore';
import { useEditorGameNpcStore } from '../../stores/game/editorGameNpcStore';
import { useEditorTransformationStore } from '../../stores/game/editorTransformationStore';
import { useEditorBaseLayoutStore } from '../../stores/game/editorBaseLayoutStore';
import { useEditorExteriorStore } from '../../stores/game/editorExteriorStore';
import { useEditorFlightEventStore } from '../../stores/game/editorFlightEventStore';
import { useEditorPathStore, getPath } from '../../stores/editorPathStore';
import { FLIGHT_PATH } from '../../data/game/flightPath';
import { ALL_WORLD_PATHS } from '../../data/game/worldRoutes';
import type { PathDefinition } from '../../types/path';

// Seed a path into POLI's editorPathStore (idempotent) so the 🛣 Tracks tab + node gizmos can edit it.
function seedPath(path: PathDefinition): void {
  if (getPath(path.id)) return;
  useEditorPathStore.setState((s) => ({ paths: [...s.paths, JSON.parse(JSON.stringify(path)) as PathDefinition] }));
  useEditorPathStore.getState().updatePath(path.id, {}); // triggers persist
}

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
  useEditorFlightEventStore.getState().mergeMissingFromSeed();

  // Seed our 航道 curves into the editorPathStore so the 🛣 Tracks tab + node gizmos edit the REAL paths
  // (fly-around around the base, and the long-distance world route).
  seedPath(FLIGHT_PATH);
  ALL_WORLD_PATHS.forEach(seedPath);
}


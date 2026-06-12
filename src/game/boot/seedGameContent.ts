import { syncAutoCharacterModelsFromLibrary, useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { useEditorLocationStore } from '../../stores/game/editorLocationStore';
import { useEditorRegionStore } from '../../stores/game/editorRegionStore';
import { useEditorAeroYokaiStore } from '../../stores/game/editorAeroYokaiStore';
import { useEditorRouteStore } from '../../stores/game/editorRouteStore';
import { useEditorMissionStore } from '../../stores/game/editorMissionStore';
import { useEditorGameNpcStore } from '../../stores/game/editorGameNpcStore';
import { useEditorTransformationStore } from '../../stores/game/editorTransformationStore';
import { useEditorBaseLayoutStore } from '../../stores/game/editorBaseLayoutStore';
import { useEditorExteriorStore } from '../../stores/game/editorExteriorStore';
import { useEditorFlightEventStore } from '../../stores/game/editorFlightEventStore';
import { useEditorDestinationStore } from '../../stores/game/editorDestinationStore';
import { useEditorSupportStore } from '../../stores/game/editorSupportStore';
import { useEditorQualityStore } from '../../stores/game/editorQualityStore';
import { useEditorAudioPresetStore } from '../../stores/game/editorAudioPresetStore';
import { useEditorFlightPolishStore } from '../../stores/game/editorFlightPolishStore';
import { useEditorTransformationPolishStore } from '../../stores/game/editorTransformationPolishStore';
import { useEditorMusicTrackStore, useEditorAmbientStore } from '../../stores/game/editorMusicStore';
import { useEditorPathStore, getPath } from '../../stores/editorPathStore';
import { useModelStudioStore } from '../../stores/modelStudioStore';
import { FLIGHT_PATH } from '../../data/game/flightPath';
import { ALL_WORLD_PATHS } from '../../data/game/worldRoutes';
import { allSuperWingsPoseAssetIds } from '../../data/game/superWingsModels';
import type { PathDefinition } from '../../types/path';

// Bigger default size for the character craft — set via Model Studio (the single source of truth for model
// scale), so the flight craft / base vehicle / transformation reveal are all bigger AND stay tunable in the
// 🎬 Model Studio tab. Only sets a default when the user hasn't tuned that model.
const DEFAULT_CRAFT_SCALE = 2.5;
const DEFAULT_NPC_SCALE = 1.6; // cartoon NPC GLBs render at Model-Studio scale (no modelTarget) — sane default
function seedCraftScale(): void {
  const ms = useModelStudioStore.getState();
  const seedScale = (id: string | undefined, scale: number): void => {
    if (id && ms.overrides[id]?.scale == null) ms.setTransform(id, { scale });
  };
  // Character robot + plane models AND every pose/variant model (so switching any pose in shows at craft size).
  for (const c of useEditorCharacterStore.getState().items) {
    seedScale(c.modelAssetId, DEFAULT_CRAFT_SCALE);
    seedScale(c.planeModelAssetId, DEFAULT_CRAFT_SCALE);
    for (const pm of c.poseModels ?? []) seedScale(pm.assetId, DEFAULT_CRAFT_SCALE);
  }
  for (const assetId of allSuperWingsPoseAssetIds()) {
    seedScale(assetId, DEFAULT_CRAFT_SCALE);
  }
  // NPC models (destination greeters / side-quest residents) — Model-Studio-scaled, default-only.
  for (const n of useEditorGameNpcStore.getState().items) {
    seedScale(n.modelAssetId, DEFAULT_NPC_SCALE);
  }
}

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
  syncAutoCharacterModelsFromLibrary();
  useEditorRegionStore.getState().mergeMissingFromSeed();
  useEditorAeroYokaiStore.getState().mergeMissingFromSeed();
  useEditorLocationStore.getState().mergeMissingFromSeed();
  useEditorRouteStore.getState().mergeMissingFromSeed();
  useEditorMissionStore.getState().mergeMissingFromSeed();
  useEditorGameNpcStore.getState().mergeMissingFromSeed();
  useEditorTransformationStore.getState().mergeMissingFromSeed();
  useEditorBaseLayoutStore.getState().mergeMissingFromSeed();
  useEditorExteriorStore.getState().mergeMissingFromSeed();
  useEditorFlightEventStore.getState().mergeMissingFromSeed();
  useEditorDestinationStore.getState().mergeMissingFromSeed();
  useEditorSupportStore.getState().mergeMissingFromSeed();
  useEditorQualityStore.getState().mergeMissingFromSeed();
  useEditorAudioPresetStore.getState().mergeMissingFromSeed();
  useEditorFlightPolishStore.getState().mergeMissingFromSeed();
  useEditorTransformationPolishStore.getState().mergeMissingFromSeed();
  useEditorMusicTrackStore.getState().mergeMissingFromSeed();
  useEditorAmbientStore.getState().mergeMissingFromSeed();

  // Seed our 航道 curves into the editorPathStore so the 🛣 Tracks tab + node gizmos edit the REAL paths
  // (fly-around around the base, and the long-distance world route).
  seedPath(FLIGHT_PATH);
  ALL_WORLD_PATHS.forEach(seedPath);
  seedCraftScale();
}

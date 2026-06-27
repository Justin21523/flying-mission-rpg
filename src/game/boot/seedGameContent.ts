import { syncAutoCharacterModelsFromLibrary, useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { useEditorLocationStore } from '../../stores/game/editorLocationStore';
import { useEditorRegionStore } from '../../stores/game/editorRegionStore';
import { useEditorAeroYokaiStore } from '../../stores/game/editorAeroYokaiStore';
import { useEditorRouteStore } from '../../stores/game/editorRouteStore';
import { useEditorMissionStore } from '../../stores/game/editorMissionStore';
import { useEditorGameNpcStore } from '../../stores/game/editorGameNpcStore';
import { useEditorTransformationStore } from '../../stores/game/editorTransformationStore';
import { useEditorBaseLayoutStore } from '../../stores/game/editorBaseLayoutStore';
import { useSkillUpgradeCurveStore } from '../../stores/game/useSkillUpgradeCurveStore';
import { useHangarUpgradeDefStore } from '../../stores/game/useHangarUpgradeDefStore';
import { useEquipmentModDefStore } from '../../stores/game/useEquipmentModDefStore';
import { useRunBuffDefStore } from '../../stores/game/useRunBuffDefStore';
import { useRunConfigStore } from '../../stores/game/useRunConfigStore';
import { useRoomConfigStore } from '../../stores/game/useRoomConfigStore';
import { useStatusRuleStore } from '../../stores/game/useStatusRuleStore';
import { useElementReactionStore } from '../../stores/game/useElementReactionStore';
import { useEliteAffixStore } from '../../stores/game/useEliteAffixStore';
import { useEditorExteriorStore } from '../../stores/game/editorExteriorStore';
import { useEditorFlightEventStore } from '../../stores/game/editorFlightEventStore';
import { useEditorDestinationStore } from '../../stores/game/editorDestinationStore';
import { useEditorMissionZoneStore } from '../../stores/game/editorMissionZoneStore';
import { useEditorZoneSegmentStore } from '../../stores/game/editorZoneSegmentStore';
import { useEditorCombatStatsStore, useEditorCombatSkillStore, useEditorDamageableStore, useEditorCombatEffectStore, useEditorEnemyStore, useEditorBossPhaseStore, useEditorSpawnGroupStore, useEditorRandomBossPoolStore } from '../../stores/game/editorCombatStore';
import { useEditorObstacleStore } from '../../stores/game/editorObstacleStore';
import { useEditorCharacterKitStore } from '../../stores/game/editorCharacterKitStore';
import { useSupportCombatEditorStore, useSupportSynergyEditorStore } from '../../stores/game/useSupportCombatEditorStore';
import { useBossDefinitionStore, useBossPhaseStore, useBossWeakpointStore, useBossAttackStore, useBossArenaStore, useBossSummonWaveStore, useEliteEncounterStore } from '../../stores/game/useBossEditorStore';
import { useCinematicEffectStore } from '../../stores/game/useCinematicEffectStore';
import { useCinematicAbilityEditorStore } from '../../stores/game/useCinematicAbilityEditorStore';
import { useCloneAbilityStore } from '../../stores/game/useCloneAbilityStore';
import { useIncidentEditorStore } from '../../stores/useIncidentEditorStore';
import { useFusionEditorStore } from '../../stores/game/useFusionEditorStore';
import { useAbilityLoadoutStore } from '../../stores/game/useAbilityLoadoutStore';
import { useVfxStyleProfileStore } from '../../stores/game/useVfxStyleProfileStore';
import { usePhysicsVfxObjectStore } from '../../stores/game/usePhysicsVfxObjectStore';
import { useEditorSupportStore } from '../../stores/game/editorSupportStore';
import { useEditorQualityStore } from '../../stores/game/editorQualityStore';
import { useEditorAudioPresetStore } from '../../stores/game/editorAudioPresetStore';
import { useEditorFlightPolishStore } from '../../stores/game/editorFlightPolishStore';
import { useEditorTransformationPolishStore } from '../../stores/game/editorTransformationPolishStore';
import { useEditorMusicTrackStore, useEditorAmbientStore } from '../../stores/game/editorMusicStore';
import { useCampaignDefinitionStore, useStageDefinitionStore, useStageRewardStore } from '../../stores/useStageEditorStore';
import { useEditorZonePropStore } from '../../stores/game/editorZonePropStore';
import { useLevelLayoutStore, useLevelSegmentStore } from '../../stores/useLevelEditorStore';
import { useEnvironmentThemeStore, useEnvironmentPropSetStore, useEnvironmentHazardPresetStore, useAmbientVfxPresetStore } from '../../stores/useEnvironmentEditorStore';
import { useEncounterPackStore, useEnemyEncounterStore } from '../../stores/useEncounterEditorStore';
import { useStageBalanceProfileStore, useStageContentPackStore, useStagePlaytestScenarioStore, useStagePolishPresetStore } from '../../stores/useStageContentEditorStore';
import { useEditorPathStore, getPath } from '../../stores/editorPathStore';
import { useModelStudioStore } from '../../stores/modelStudioStore';
import { FLIGHT_PATH } from '../../data/game/flightPath';
import { ALL_WORLD_PATHS } from '../../data/game/worldRoutes';
import { allHeroPoseAssetIds } from '../../data/game/heroModels';
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
  for (const assetId of allHeroPoseAssetIds()) {
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
  // Batch J — reconcile (versioned) so shipped zone/segment changes (auto-combat landing, per-segment
  // environment themes) reach existing saves; user-authored zones/segments are preserved.
  useEditorMissionZoneStore.getState().reconcileFromSeed();
  useEditorZoneSegmentStore.getState().reconcileFromSeed();
  useEditorCombatStatsStore.getState().mergeMissingFromSeed();
  useEditorCombatSkillStore.getState().mergeMissingFromSeed();
  useEditorDamageableStore.getState().mergeMissingFromSeed();
  useEditorCombatEffectStore.getState().mergeMissingFromSeed();
  useEditorEnemyStore.getState().mergeMissingFromSeed();
  useEditorBossPhaseStore.getState().mergeMissingFromSeed();
  useEditorSpawnGroupStore.getState().mergeMissingFromSeed();
  useEditorRandomBossPoolStore.getState().reconcileFromSeed(); // World-build W1 — add skyport elite candidate
  useSkillUpgradeCurveStore.getState().mergeMissingFromSeed();
  useHangarUpgradeDefStore.getState().mergeMissingFromSeed();
  useEquipmentModDefStore.getState().mergeMissingFromSeed();
  useRunBuffDefStore.getState().mergeMissingFromSeed();
  useRunConfigStore.getState().mergeMissingFromSeed();
  useRoomConfigStore.getState().mergeMissingFromSeed();
  useStatusRuleStore.getState().mergeMissingFromSeed();
  useElementReactionStore.getState().mergeMissingFromSeed();
  useEliteAffixStore.getState().mergeMissingFromSeed();
  useEditorObstacleStore.getState().mergeMissingFromSeed();
  useEditorCharacterKitStore.getState().mergeMissingFromSeed();
  useEditorSupportStore.getState().mergeMissingFromSeed();
  useSupportCombatEditorStore.getState().mergeMissingFromSeed();
  useSupportSynergyEditorStore.getState().mergeMissingFromSeed();
  useBossDefinitionStore.getState().reconcileFromSeed(); // Batch E — refresh shipped bosses with intro/enrage
  useBossPhaseStore.getState().mergeMissingFromSeed();
  useBossWeakpointStore.getState().mergeMissingFromSeed();
  useBossAttackStore.getState().mergeMissingFromSeed();
  useBossArenaStore.getState().mergeMissingFromSeed();
  useBossSummonWaveStore.getState().mergeMissingFromSeed();
  useEliteEncounterStore.getState().mergeMissingFromSeed();
  // Cinematic effects: reconcile (refresh shipped effect content on a seedVersion bump) — the runtime resolves
  // effects from this persisted store, so returning users must pick up authored-content changes.
  useCinematicEffectStore.getState().reconcileFromSeed();
  useCinematicAbilityEditorStore.getState().reconcileFromSeed();
  useCloneAbilityStore.getState().reconcileFromSeed();
  useIncidentEditorStore.getState().reconcileFromSeed();
  useFusionEditorStore.getState().reconcileFromSeed();
  useAbilityLoadoutStore.getState().mergeMissingFromSeed();
  useVfxStyleProfileStore.getState().reconcileFromSeed();
  usePhysicsVfxObjectStore.getState().mergeMissingFromSeed();
  useEditorQualityStore.getState().mergeMissingFromSeed();
  useEditorAudioPresetStore.getState().mergeMissingFromSeed();
  useEditorFlightPolishStore.getState().mergeMissingFromSeed();
  useEditorTransformationPolishStore.getState().mergeMissingFromSeed();
  useEditorMusicTrackStore.getState().mergeMissingFromSeed();
  useEditorAmbientStore.getState().mergeMissingFromSeed();
  useCampaignDefinitionStore.getState().reconcileFromSeed(); // World-build W1 — refresh branching unlockRules
  useStageDefinitionStore.getState().reconcileFromSeed(); // World-build W1 — refresh fork unlocksOnClear
  useEditorZonePropStore.getState().mergeMissingFromSeed(); // World-build W2 — decorative zone props
  useStageRewardStore.getState().mergeMissingFromSeed();
  useLevelLayoutStore.getState().mergeMissingFromSeed();
  useLevelSegmentStore.getState().mergeMissingFromSeed();
  useEnvironmentThemeStore.getState().mergeMissingFromSeed();
  useEnvironmentPropSetStore.getState().mergeMissingFromSeed();
  useEnvironmentHazardPresetStore.getState().mergeMissingFromSeed();
  useAmbientVfxPresetStore.getState().mergeMissingFromSeed();
  useEncounterPackStore.getState().mergeMissingFromSeed();
  useEnemyEncounterStore.getState().mergeMissingFromSeed();
  useStageContentPackStore.getState().mergeMissingFromSeed();
  useStageBalanceProfileStore.getState().mergeMissingFromSeed();
  useStagePolishPresetStore.getState().mergeMissingFromSeed();
  useStagePlaytestScenarioStore.getState().mergeMissingFromSeed();

  // Seed our 航道 curves into the editorPathStore so the 🛣 Tracks tab + node gizmos edit the REAL paths
  // (fly-around around the base, and the long-distance world route).
  seedPath(FLIGHT_PATH);
  ALL_WORLD_PATHS.forEach(seedPath);
  seedCraftScale();
}

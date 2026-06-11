import { useSceneEditStore } from '../../stores/sceneEditStore';
import { useModelStudioStore } from '../../stores/modelStudioStore';
import { useEditorEnvironmentStore } from '../../stores/editorEnvironmentStore';
import { useEditorTriggerStore } from '../../stores/editorTriggerStore';
import { useEditorNpcStore } from '../../stores/editorNpcStore';
import { useEditorQuestStore } from '../../stores/editorQuestStore';
import { useEditorEncounterStore } from '../../stores/editorEncounterStore';
import { useEditorActivityStore } from '../../stores/editorActivityStore';
import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';
import { useEditorLandmarkStore } from '../../stores/editorLandmarkStore';
import { useEditorIncidentStore } from '../../stores/editorIncidentStore';
import { useEditorRandomEventStore } from '../../stores/editorRandomEventStore';
import { useEditorTrafficStore } from '../../stores/editorTrafficStore';
import { useEditorToolStore } from '../../stores/editorToolStore';
import { useEditorWorldStore } from '../../stores/editorWorldStore';
import { useEditorLayoutStore } from '../../stores/editorLayoutStore';
import { useEditorCollectibleStore } from '../../stores/editorCollectibleStore';
import { useEditorPortalStore } from '../../stores/editorPortalStore';
import { useEditorPathStore } from '../../stores/editorPathStore';
import { useEditorBoostPadStore } from '../../stores/editorBoostPadStore';
import { useEditorCollisionStore } from '../../stores/editorCollisionStore';
import { useEditorAnimationStore } from '../../stores/editorAnimationStore';
import { useEditorSurfaceStore } from '../../stores/editorSurfaceStore';
import { useEditorPathFollowerStore } from '../../stores/editorPathFollowerStore';
import { useEditorTrafficScenarioStore } from '../../stores/editorTrafficScenarioStore';
// New game (aero-rescue) authored-content stores.
import { useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { useEditorLocationStore } from '../../stores/game/editorLocationStore';
import { useEditorRouteStore } from '../../stores/game/editorRouteStore';
import { useEditorMissionStore } from '../../stores/game/editorMissionStore';
import { useEditorGameNpcStore } from '../../stores/game/editorGameNpcStore';
import { useEditorTransformationStore } from '../../stores/game/editorTransformationStore';
import { useEditorBaseLayoutStore } from '../../stores/game/editorBaseLayoutStore';
import { useEditorFlightStore } from '../../stores/game/editorFlightStore';
import { useEditorExteriorStore } from '../../stores/game/editorExteriorStore';
import { useEditorFlightEventStore } from '../../stores/game/editorFlightEventStore';
import { useEditorDestinationStore } from '../../stores/game/editorDestinationStore';
import { useEditorCameraStore } from '../../stores/game/editorCameraStore';
import { useEditorFlightCueStore } from '../../stores/game/editorFlightCueStore';
import { useEditorRegionStore } from '../../stores/game/editorRegionStore';
import { ABILITY_TYPES } from '../../types/character';
import { COLLECTIBLE_SHAPES } from '../../types/collectible';
import { useRescueLicenseStore } from '../../stores/rescueLicenseStore';
import { useJinResearchStore } from '../../stores/jinResearchStore';
import { useEditorBoostStore, getBoostConfig } from '../../stores/editorBoostStore';
import { useProgressionStore } from '../../stores/progressionStore';
import { useRelationshipStore } from '../../stores/relationshipStore';
import { useAudioStore } from '../../stores/audioStore';
import { MODEL_ASSET_LIST } from '../../data/modelLibrary';
import { TEXTURE_SETS } from '../world/textureLibrary';
import { getAllAreas } from '../../data/areas';
import { BIOME_THEMES } from '../../data/environmentThemes';
import { CORE_TEAM } from '../../data/characters/coreTeam';

// Editor-content stores whose changes should be tracked for global Undo/Redo (see editorUndoStore). Subscribing
// to these covers every authoring edit — gizmo moves, tab fields, deletes — so Ctrl+Z always has something to do.
export const EDITOR_STORES: { subscribe: (cb: () => void) => () => void }[] = [
  useSceneEditStore, useModelStudioStore, useEditorEnvironmentStore, useEditorTriggerStore, useEditorNpcStore,
  useEditorQuestStore, useEditorEncounterStore, useEditorActivityStore, useEditorPoliCharacterStore,
  useEditorLandmarkStore, useEditorIncidentStore, useEditorRandomEventStore, useEditorTrafficStore,
  useEditorToolStore, useEditorWorldStore, useEditorLayoutStore, useEditorCollectibleStore, useEditorPortalStore,
  useEditorBoostStore, useJinResearchStore, useEditorPathStore, useEditorBoostPadStore,
  useEditorCollisionStore, useEditorAnimationStore, useEditorSurfaceStore, useEditorPathFollowerStore,
  useEditorTrafficScenarioStore,
  // New game authored-content stores (undo tracking).
  useEditorCharacterStore, useEditorLocationStore, useEditorRouteStore, useEditorMissionStore,
  useEditorGameNpcStore, useEditorTransformationStore, useEditorBaseLayoutStore,
  useEditorFlightStore, useEditorExteriorStore, useEditorFlightEventStore, useEditorDestinationStore,
  useEditorCameraStore, useEditorFlightCueStore, useEditorRegionStore,
];

// Kit — a single registry describing every editable content domain (each backed by its own store) with
// serialize / deserialize / clear / summary hooks. The foundation for the unified project Export/Import.
// No source files are written — everything round-trips through the live stores + localStorage.
export interface EditorContentDomain {
  id: string;
  label: string;
  serialize: () => unknown;
  deserialize: (data: unknown) => void;
  clear: () => void;
  summary: () => string;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';

export const EDITOR_CONTENT_DOMAINS: EditorContentDomain[] = [
  // ── aero-rescue game content (current project) ──
  {
    id: 'gameCharacter',
    label: 'Game Characters',
    serialize: () => { const s = useEditorCharacterStore.getState(); return { items: s.items, seeded: s.seeded }; },
    deserialize: (data) => { if (isObj(data)) useEditorCharacterStore.getState().importState(data as { items?: never }); },
    clear: () => useEditorCharacterStore.getState().reset(),
    summary: () => `${useEditorCharacterStore.getState().items.length} characters`,
  },
  {
    id: 'gameLocation',
    label: 'Game Locations',
    serialize: () => { const s = useEditorLocationStore.getState(); return { items: s.items, seeded: s.seeded }; },
    deserialize: (data) => { if (isObj(data)) useEditorLocationStore.getState().importState(data as { items?: never }); },
    clear: () => useEditorLocationStore.getState().reset(),
    summary: () => `${useEditorLocationStore.getState().items.length} locations`,
  },
  {
    id: 'gameRegion',
    label: 'Map Regions',
    serialize: () => { const s = useEditorRegionStore.getState(); return { items: s.items, seeded: s.seeded }; },
    deserialize: (data) => { if (isObj(data)) useEditorRegionStore.getState().importState(data as { items?: never }); },
    clear: () => useEditorRegionStore.getState().reset(),
    summary: () => `${useEditorRegionStore.getState().items.length} regions`,
  },
  {
    id: 'gameRoute',
    label: 'Flight Routes',
    serialize: () => { const s = useEditorRouteStore.getState(); return { items: s.items, seeded: s.seeded }; },
    deserialize: (data) => { if (isObj(data)) useEditorRouteStore.getState().importState(data as { items?: never }); },
    clear: () => useEditorRouteStore.getState().reset(),
    summary: () => `${useEditorRouteStore.getState().items.length} routes`,
  },
  {
    id: 'gameMission',
    label: 'Missions',
    serialize: () => { const s = useEditorMissionStore.getState(); return { items: s.items, seeded: s.seeded }; },
    deserialize: (data) => { if (isObj(data)) useEditorMissionStore.getState().importState(data as { items?: never }); },
    clear: () => useEditorMissionStore.getState().reset(),
    summary: () => `${useEditorMissionStore.getState().items.length} missions`,
  },
  {
    id: 'gameNpc',
    label: 'Game NPCs',
    serialize: () => { const s = useEditorGameNpcStore.getState(); return { items: s.items, seeded: s.seeded }; },
    deserialize: (data) => { if (isObj(data)) useEditorGameNpcStore.getState().importState(data as { items?: never }); },
    clear: () => useEditorGameNpcStore.getState().reset(),
    summary: () => `${useEditorGameNpcStore.getState().items.length} NPCs`,
  },
  {
    id: 'gameTransformation',
    label: 'Transformations',
    serialize: () => { const s = useEditorTransformationStore.getState(); return { items: s.items, seeded: s.seeded }; },
    deserialize: (data) => { if (isObj(data)) useEditorTransformationStore.getState().importState(data as { items?: never }); },
    clear: () => useEditorTransformationStore.getState().reset(),
    summary: () => `${useEditorTransformationStore.getState().items.length} transformations`,
  },
  {
    id: 'gameBase',
    label: 'Base Layout',
    serialize: () => { const s = useEditorBaseLayoutStore.getState(); return { items: s.items, seeded: s.seeded }; },
    deserialize: (data) => { if (isObj(data)) useEditorBaseLayoutStore.getState().importState(data as { items?: never }); },
    clear: () => useEditorBaseLayoutStore.getState().reset(),
    summary: () => `${useEditorBaseLayoutStore.getState().items.length} base parts`,
  },
  {
    id: 'gameExterior',
    label: 'Exterior + Navpoints',
    serialize: () => { const s = useEditorExteriorStore.getState(); return { items: s.items, seeded: s.seeded }; },
    deserialize: (data) => { if (isObj(data)) useEditorExteriorStore.getState().importState(data as { items?: never }); },
    clear: () => useEditorExteriorStore.getState().reset(),
    summary: () => `${useEditorExteriorStore.getState().items.length} exterior parts`,
  },
  {
    id: 'gameFlightEvent',
    label: 'Flight Events',
    serialize: () => { const s = useEditorFlightEventStore.getState(); return { items: s.items, seeded: s.seeded }; },
    deserialize: (data) => { if (isObj(data)) useEditorFlightEventStore.getState().importState(data as { items?: never }); },
    clear: () => useEditorFlightEventStore.getState().reset(),
    summary: () => `${useEditorFlightEventStore.getState().items.length} flight events`,
  },
  {
    id: 'gameDestination',
    label: 'Destination Layout',
    serialize: () => { const s = useEditorDestinationStore.getState(); return { items: s.items, seeded: s.seeded }; },
    deserialize: (data) => { if (isObj(data)) useEditorDestinationStore.getState().importState(data as { items?: never }); },
    clear: () => useEditorDestinationStore.getState().reset(),
    summary: () => `${useEditorDestinationStore.getState().items.length} destination parts`,
  },
  {
    id: 'gameCamera',
    label: 'Phase Cameras',
    serialize: () => ({ byPhase: useEditorCameraStore.getState().byPhase }),
    deserialize: (data) => { if (isObj(data)) useEditorCameraStore.getState().importState(data as { byPhase?: never }); },
    clear: () => useEditorCameraStore.getState().reset(),
    summary: () => `${Object.keys(useEditorCameraStore.getState().byPhase).length} phase cameras`,
  },
  {
    id: 'gameFlight',
    label: 'Flight Tuning',
    serialize: () => ({ tuning: useEditorFlightStore.getState().tuning }),
    deserialize: (data) => { if (isObj(data)) useEditorFlightStore.getState().importState(data as { tuning?: never }); },
    clear: () => useEditorFlightStore.getState().reset(),
    summary: () => `max ${useEditorFlightStore.getState().tuning.maxSpeed}`,
  },
  {
    id: 'gameFlightCues',
    label: 'Flight Cues',
    serialize: () => ({ byPath: useEditorFlightCueStore.getState().byPath }),
    deserialize: (data) => { if (isObj(data)) useEditorFlightCueStore.getState().importState(data as { byPath?: never }); },
    clear: () => useEditorFlightCueStore.getState().reset(),
    summary: () => `${Object.values(useEditorFlightCueStore.getState().byPath).reduce((n, l) => n + l.length, 0)} flight cues`,
  },
  {
    id: 'sceneEdit',
    label: 'Scene Edits',
    serialize: () => {
      const s = useSceneEditStore.getState();
      return { overrides: s.overrides, deleted: s.deleted, added: s.added, addedYokai: s.addedYokai };
    },
    deserialize: (data) => { if (isObj(data)) useSceneEditStore.getState().importPersist(data); },
    clear: () => useSceneEditStore.getState().resetAll(),
    summary: () => {
      const s = useSceneEditStore.getState();
      return `${Object.keys(s.overrides).length} edits · ${s.added.length} models · ${Object.keys(s.deleted).length} hidden`;
    },
  },
  {
    id: 'modelStudio',
    label: 'Model Studio',
    serialize: () => ({ overrides: useModelStudioStore.getState().overrides }),
    deserialize: (data) => { if (isObj(data) && isObj(data.overrides)) useModelStudioStore.getState().importState(data.overrides); },
    clear: () => useModelStudioStore.getState().reset(),
    summary: () => `${Object.keys(useModelStudioStore.getState().overrides).length} models tuned`,
  },
  {
    id: 'editorEnvironment',
    label: 'Environment / Sky',
    serialize: () => { const s = useEditorEnvironmentStore.getState(); return { overrides: s.overrides, defaultMode: s.defaultMode }; },
    deserialize: (data) => { if (isObj(data)) useEditorEnvironmentStore.getState().importState(data); },
    clear: () => useEditorEnvironmentStore.getState().reset(),
    summary: () => { const s = useEditorEnvironmentStore.getState(); return `${Object.keys(s.overrides).length} areas tuned · ${s.defaultMode}`; },
  },
  {
    id: 'editorTrigger',
    label: 'Triggers',
    serialize: () => { const s = useEditorTriggerStore.getState(); return { triggers: s.triggers, firedOnce: s.firedOnce }; },
    deserialize: (data) => { if (isObj(data)) useEditorTriggerStore.getState().importState(data); },
    clear: () => useEditorTriggerStore.getState().reset(),
    summary: () => `${useEditorTriggerStore.getState().triggers.length} triggers`,
  },
  {
    id: 'editorNpc',
    label: 'NPCs & Dialogue',
    serialize: () => { const s = useEditorNpcStore.getState(); return { addedNpcs: s.addedNpcs, dialogueTrees: s.dialogueTrees }; },
    deserialize: (data) => { if (isObj(data)) useEditorNpcStore.getState().importState(data as { addedNpcs?: never; dialogueTrees?: never }); },
    clear: () => useEditorNpcStore.getState().reset(),
    summary: () => { const s = useEditorNpcStore.getState(); return `${s.addedNpcs.length} NPCs · ${Object.keys(s.dialogueTrees).length} dialogues`; },
  },
  {
    id: 'editorQuest',
    label: 'Quests & Items',
    serialize: () => { const s = useEditorQuestStore.getState(); return { quests: s.quests, items: s.items }; },
    deserialize: (data) => { if (isObj(data)) useEditorQuestStore.getState().importState(data as { quests?: never; items?: never }); },
    clear: () => useEditorQuestStore.getState().reset(),
    summary: () => { const s = useEditorQuestStore.getState(); return `${s.quests.length} quests · ${s.items.length} items`; },
  },
  {
    id: 'editorEncounter',
    label: 'Encounters & Combatants',
    serialize: () => { const s = useEditorEncounterStore.getState(); return { encounters: s.encounters, combatants: s.combatants }; },
    deserialize: (data) => { if (isObj(data)) useEditorEncounterStore.getState().importState(data as { encounters?: never; combatants?: never }); },
    clear: () => useEditorEncounterStore.getState().reset(),
    summary: () => { const s = useEditorEncounterStore.getState(); return `${s.encounters.length} encounters · ${s.combatants.length} combatants`; },
  },
  {
    id: 'editorActivity',
    label: 'Mini-games',
    serialize: () => ({ activities: useEditorActivityStore.getState().activities }),
    deserialize: (data) => { if (isObj(data)) useEditorActivityStore.getState().importState(data as { activities?: never }); },
    clear: () => useEditorActivityStore.getState().reset(),
    summary: () => `${useEditorActivityStore.getState().activities.length} mini-games`,
  },
  {
    id: 'editorPoliCharacter',
    label: 'POLI Characters',
    serialize: () => ({ overrides: useEditorPoliCharacterStore.getState().overrides }),
    deserialize: (data) => { if (isObj(data)) useEditorPoliCharacterStore.getState().importState(data as { overrides?: never }); },
    clear: () => useEditorPoliCharacterStore.getState().reset(),
    summary: () => `${Object.keys(useEditorPoliCharacterStore.getState().overrides).length} character overrides`,
  },
  {
    id: 'editorLandmark',
    label: 'Landmarks',
    serialize: () => ({ landmarks: useEditorLandmarkStore.getState().landmarks }),
    deserialize: (data) => { if (isObj(data)) useEditorLandmarkStore.getState().importState(data as { landmarks?: never }); },
    clear: () => useEditorLandmarkStore.getState().reset(),
    summary: () => `${useEditorLandmarkStore.getState().landmarks.length} landmarks`,
  },
  {
    id: 'editorIncident',
    label: 'Incidents',
    serialize: () => ({ incidents: useEditorIncidentStore.getState().incidents }),
    deserialize: (data) => { if (isObj(data)) useEditorIncidentStore.getState().importState(data as { incidents?: never }); },
    clear: () => useEditorIncidentStore.getState().reset(),
    summary: () => `${useEditorIncidentStore.getState().incidents.length} incidents`,
  },
  {
    id: 'editorRandomEvent',
    label: 'Random Events',
    serialize: () => { const s = useEditorRandomEventStore.getState(); return { enabled: s.enabled, intervalSec: s.intervalSec, maxConcurrent: s.maxConcurrent, incidents: s.incidents, reaction: s.reaction }; },
    deserialize: (data) => { if (isObj(data)) useEditorRandomEventStore.getState().importState(data as never); },
    clear: () => useEditorRandomEventStore.getState().reset(),
    summary: () => `director ${useEditorRandomEventStore.getState().enabled ? 'on' : 'off'}`,
  },
  {
    id: 'editorTraffic',
    label: 'Traffic',
    serialize: () => { const s = useEditorTrafficStore.getState(); return { vehicles: s.vehicles, signals: s.signals, roads: s.roads, crosswalks: s.crosswalks, emergencyYield: s.emergencyYield, vehicleIncidents: s.vehicleIncidents, vehicleIncidentEverySec: s.vehicleIncidentEverySec }; },
    deserialize: (data) => { if (isObj(data)) useEditorTrafficStore.getState().importState(data as never); },
    clear: () => useEditorTrafficStore.getState().reset(),
    summary: () => { const s = useEditorTrafficStore.getState(); return `${s.vehicles.length} vehicles · ${s.signals.length} signals · ${s.roads.length} roads`; },
  },
  {
    id: 'editorTool',
    label: 'Tools',
    serialize: () => { const s = useEditorToolStore.getState(); return { tools: s.tools, upgrades: s.upgrades }; },
    deserialize: (data) => { if (isObj(data)) useEditorToolStore.getState().importState(data as never); },
    clear: () => useEditorToolStore.getState().reset(),
    summary: () => `${useEditorToolStore.getState().tools.length} tools`,
  },
  {
    id: 'editorPortal',
    label: 'Portals',
    serialize: () => ({ portals: useEditorPortalStore.getState().portals }),
    deserialize: (data) => { if (isObj(data)) useEditorPortalStore.getState().importState(data as never); },
    clear: () => useEditorPortalStore.getState().reset(),
    summary: () => `${useEditorPortalStore.getState().portals.length} portals`,
  },
  {
    id: 'editorPath',
    label: 'Paths',
    serialize: () => ({ paths: useEditorPathStore.getState().paths }),
    deserialize: (data) => { if (isObj(data)) useEditorPathStore.getState().importState(data as never); },
    clear: () => useEditorPathStore.getState().reset(),
    summary: () => `${useEditorPathStore.getState().paths.length} paths`,
  },
  {
    id: 'editorBoostPad',
    label: 'Boost Pads',
    serialize: () => ({ pads: useEditorBoostPadStore.getState().pads }),
    deserialize: (data) => { if (isObj(data)) useEditorBoostPadStore.getState().importState(data as never); },
    clear: () => useEditorBoostPadStore.getState().reset(),
    summary: () => `${useEditorBoostPadStore.getState().pads.length} boost pads`,
  },
  {
    id: 'editorCollision',
    label: 'Collision Rules',
    serialize: () => { const s = useEditorCollisionStore.getState(); return { objects: s.objects, rules: s.rules }; },
    deserialize: (data) => { if (isObj(data)) useEditorCollisionStore.getState().importState(data as never); },
    clear: () => useEditorCollisionStore.getState().reset(),
    summary: () => { const s = useEditorCollisionStore.getState(); return `${s.objects.length} objects · ${s.rules.length} rules`; },
  },
  {
    id: 'editorAnimation',
    label: 'Animations',
    serialize: () => { const s = useEditorAnimationStore.getState(); return { definitions: s.definitions, profiles: s.profiles }; },
    deserialize: (data) => { if (isObj(data)) useEditorAnimationStore.getState().importState(data as never); },
    clear: () => useEditorAnimationStore.getState().reset(),
    summary: () => `${useEditorAnimationStore.getState().definitions.length} animations`,
  },
  {
    id: 'editorSurface',
    label: 'Surfaces',
    serialize: () => { const s = useEditorSurfaceStore.getState(); return { surfaces: s.surfaces, zones: s.zones }; },
    deserialize: (data) => { if (isObj(data)) useEditorSurfaceStore.getState().importState(data as never); },
    clear: () => useEditorSurfaceStore.getState().reset(),
    summary: () => `${useEditorSurfaceStore.getState().surfaces.length} surfaces`,
  },
  {
    id: 'editorPathFollower',
    label: 'Path Followers',
    serialize: () => ({ followers: useEditorPathFollowerStore.getState().followers }),
    deserialize: (data) => { if (isObj(data)) useEditorPathFollowerStore.getState().importState(data as never); },
    clear: () => useEditorPathFollowerStore.getState().reset(),
    summary: () => `${useEditorPathFollowerStore.getState().followers.length} followers`,
  },
  {
    id: 'editorTrafficScenario',
    label: 'Traffic Scenarios',
    serialize: () => { const s = useEditorTrafficScenarioStore.getState(); return { scenarios: s.scenarios, enabled: s.enabled, intervalSec: s.intervalSec, maxConcurrent: s.maxConcurrent }; },
    deserialize: (data) => { if (isObj(data)) useEditorTrafficScenarioStore.getState().importState(data as never); },
    clear: () => useEditorTrafficScenarioStore.getState().reset(),
    summary: () => `${useEditorTrafficScenarioStore.getState().scenarios.length} traffic scenarios`,
  },
  {
    id: 'editorCollectible',
    label: 'Collectibles',
    serialize: () => { const s = useEditorCollectibleStore.getState(); return { types: s.types, resources: s.resources }; },
    deserialize: (data) => { if (isObj(data)) useEditorCollectibleStore.getState().importState(data as never); },
    clear: () => useEditorCollectibleStore.getState().reset(),
    summary: () => { const s = useEditorCollectibleStore.getState(); return `${s.types.length} collectibles · ${s.resources.length} resources`; },
  },
  {
    id: 'editorWorld',
    label: 'World',
    serialize: () => { const s = useEditorWorldStore.getState(); return { districts: s.districts, areas: s.areas }; },
    deserialize: (data) => { if (isObj(data)) useEditorWorldStore.getState().importState(data as never); },
    clear: () => useEditorWorldStore.getState().reset(),
    summary: () => { const s = useEditorWorldStore.getState(); return `${s.districts.length} districts · ${s.areas.length} areas`; },
  },
  {
    id: 'editorLayout',
    label: 'Layouts',
    serialize: () => { const s = useEditorLayoutStore.getState(); return { presets: s.presets, activePresetId: s.activePresetId }; },
    deserialize: (data) => { if (isObj(data)) useEditorLayoutStore.getState().importState(data as never); },
    clear: () => useEditorLayoutStore.getState().reset(),
    summary: () => `${Object.values(useEditorLayoutStore.getState().presets).reduce((n, l) => n + l.length, 0)} layout presets`,
  },
  {
    id: 'editorLicense',
    label: 'License',
    serialize: () => { const s = useRescueLicenseStore.getState(); return { rescuesCompleted: s.rescuesCompleted, tiers: s.tiers }; },
    deserialize: (data) => { if (isObj(data)) useRescueLicenseStore.getState().importState(data as never); },
    clear: () => useRescueLicenseStore.getState().reset(),
    summary: () => `${useRescueLicenseStore.getState().tiers.length} tiers`,
  },
  {
    id: 'editorResearch',
    label: 'Research',
    serialize: () => { const s = useJinResearchStore.getState(); return { researchPoints: s.researchPoints, completed: s.completed, projects: s.projects }; },
    deserialize: (data) => { if (isObj(data)) useJinResearchStore.getState().importState(data as never); },
    clear: () => useJinResearchStore.getState().reset(),
    summary: () => `${useJinResearchStore.getState().projects.length} projects`,
  },
  {
    id: 'editorBoost',
    label: 'Boost',
    serialize: () => getBoostConfig(),
    deserialize: (data) => { if (isObj(data)) useEditorBoostStore.getState().importState(data as never); },
    clear: () => useEditorBoostStore.getState().reset(),
    summary: () => { const c = getBoostConfig(); return `meter ${c.meterMax} · ${c.pickupCount} pickups/area`; },
  },
  // Config + progress domains — individually JSON-controllable (surfaced in the 🧪 Debug tab).
  {
    id: 'progression',
    label: 'Progression',
    serialize: () => { const s = useProgressionStore.getState(); return { level: s.level, exp: s.exp }; },
    deserialize: (data) => { if (isObj(data)) useProgressionStore.getState().importState(data as never); },
    clear: () => useProgressionStore.getState().reset(),
    summary: () => { const s = useProgressionStore.getState(); return `lv ${s.level} · ${s.exp} exp`; },
  },
  {
    id: 'relationships',
    label: 'Relationships',
    serialize: () => ({ trust: { ...useRelationshipStore.getState().trust } }),
    deserialize: (data) => { if (isObj(data)) useRelationshipStore.getState().importState(data as never); },
    clear: () => useRelationshipStore.getState().reset(),
    summary: () => `${Object.keys(useRelationshipStore.getState().trust).length} tracked`,
  },
  {
    id: 'settings',
    label: 'Settings',
    serialize: () => { const s = useAudioStore.getState(); return { particlesEnabled: s.particlesEnabled, particleDensity: s.particleDensity, sfxEnabled: s.sfxEnabled, sfxVolume: s.sfxVolume, textScale: s.textScale, highContrast: s.highContrast, reduceMotion: s.reduceMotion }; },
    deserialize: (data) => { if (isObj(data)) useAudioStore.getState().importState(data as never); },
    clear: () => useAudioStore.getState().reset(),
    summary: () => { const s = useAudioStore.getState(); return `text ${Math.round(s.textScale * 100)}% · sfx ${s.sfxEnabled ? 'on' : 'off'}`; },
  },
];

// ── Unified project file ────────────────────────────────────────────────────
export const EDITOR_PROJECT_KIND = 'r3f-rpg-builder-editor-project' as const;
export const EDITOR_PROJECT_VERSION = 1 as const;

export interface EditorProjectFile {
  kind: typeof EDITOR_PROJECT_KIND;
  version: typeof EDITOR_PROJECT_VERSION;
  exportedAt: string;
  domains: Record<string, unknown>;
}

export function exportEditorProject(): EditorProjectFile {
  const domains: Record<string, unknown> = {};
  for (const d of EDITOR_CONTENT_DOMAINS) {
    try { domains[d.id] = d.serialize(); } catch { /* skip a failing domain */ }
  }
  return { kind: EDITOR_PROJECT_KIND, version: EDITOR_PROJECT_VERSION, exportedAt: new Date().toISOString(), domains };
}

export function importEditorProject(file: unknown, opts?: { only?: string[] }): { applied: string[]; skipped: string[] } {
  const applied: string[] = [];
  const skipped: string[] = [];
  if (!isObj(file) || file.kind !== EDITOR_PROJECT_KIND || !isObj(file.domains)) return { applied, skipped: ['(invalid project file)'] };
  const domains = file.domains as Record<string, unknown>;
  for (const d of EDITOR_CONTENT_DOMAINS) {
    if (opts?.only && !opts.only.includes(d.id)) continue;
    if (!(d.id in domains)) { skipped.push(d.id); continue; }
    try { d.deserialize(domains[d.id]); applied.push(d.id); } catch { skipped.push(d.id); }
  }
  return { applied, skipped };
}

// ── Per-domain single-file IO ───────────────────────────────────────────────
export const EDITOR_DOMAIN_KIND = 'r3f-rpg-builder-editor-domain' as const;

export interface EditorDomainFile {
  kind: typeof EDITOR_DOMAIN_KIND;
  domain: string;
  version: typeof EDITOR_PROJECT_VERSION;
  exportedAt: string;
  data: unknown;
}

export function getDomain(id: string): EditorContentDomain | undefined {
  return EDITOR_CONTENT_DOMAINS.find((d) => d.id === id);
}

export function exportDomainFile(id: string): EditorDomainFile | null {
  const d = getDomain(id);
  if (!d) return null;
  return { kind: EDITOR_DOMAIN_KIND, domain: id, version: EDITOR_PROJECT_VERSION, exportedAt: new Date().toISOString(), data: d.serialize() };
}

// ── Example / template export (so an external tool knows the schema + valid ids) ─────────────────────
// Curated id lists an external author may reference, per domain. Extra keys are ignored on import.
function listModels(): string[] { return MODEL_ASSET_LIST.map((a) => a.id); }
function listTextures(): string[] { return TEXTURE_SETS.map((s) => s.albedoKey ?? s.id).filter(Boolean) as string[]; }
function listAreas(): string[] { return getAllAreas().map((a) => a.id); }
function listBiomes(): string[] { return Object.keys(BIOME_THEMES); }
function listChars(): string[] { return CORE_TEAM.map((c) => c.id); }
function listTools(): string[] { return useEditorToolStore.getState().tools.map((t) => t.id); }
function listIncidents(): string[] { return useEditorIncidentStore.getState().incidents.map((i) => i.id); }
function listQuests(): string[] { return useEditorQuestStore.getState().quests.map((q) => q.id); }
function listNpcs(): { id: string; name: string }[] { return useEditorNpcStore.getState().addedNpcs.map((n) => ({ id: n.id, name: n.displayName })); }
function listDialogues(): string[] { return Object.keys(useEditorNpcStore.getState().dialogueTrees); }

function domainReference(id: string): Record<string, unknown> {
  switch (id) {
    case 'editorWorld':
    case 'editorLayout': return { models: listModels(), textures: listTextures(), areas: listAreas(), biomes: listBiomes() };
    case 'editorIncident':
    case 'editorRandomEvent': return { areas: listAreas(), incidents: listIncidents() };
    case 'editorNpc': return { models: listModels(), areas: listAreas(), dialogues: listDialogues(), quests: listQuests() };
    case 'editorQuest': return { areas: listAreas(), npcs: listNpcs() };
    case 'editorPoliCharacter': return { characters: listChars(), models: listModels() };
    case 'editorTool': return { tools: listTools(), incidents: listIncidents() };
    case 'editorResearch': return { tools: listTools() };
    case 'editorLandmark': return { areas: listAreas(), models: listModels() };
    case 'editorTraffic': return { areas: listAreas() };
    case 'editorTrigger': return { areas: listAreas(), quests: listQuests() };
    case 'editorEnvironment': return { areas: listAreas(), textures: listTextures() };
    case 'editorCollectible': return { abilities: [...ABILITY_TYPES], shapes: [...COLLECTIBLE_SHAPES], resources: useEditorCollectibleStore.getState().resources.map((r) => r.id) };
    case 'editorPortal': return { areas: listAreas(), models: listModels(), portals: useEditorPortalStore.getState().portals.map((p) => p.id) };
    default: return { areas: listAreas() };
  }
}

export function exportDomainExample(id: string): (EditorDomainFile & { _readme: string; _reference: Record<string, unknown> }) | null {
  const d = getDomain(id);
  if (!d) return null;
  return {
    kind: EDITOR_DOMAIN_KIND,
    domain: id,
    version: EDITOR_PROJECT_VERSION,
    exportedAt: new Date().toISOString(),
    _readme: `Example for "${d.label}". Edit the "data" object and re-import it via the ⬆ button (or the Project tab). "_reference" lists valid ids you may use for this domain — it is ignored on import. You may also import just the bare "data" object.`,
    _reference: domainReference(id),
    data: d.serialize(),
  };
}

export function importDomainFile(file: unknown, fallbackId?: string): { ok: boolean; domain?: string; error?: string } {
  if (isObj(file) && file.kind === EDITOR_DOMAIN_KIND && typeof file.domain === 'string') {
    const d = getDomain(file.domain);
    if (!d) return { ok: false, error: `unknown domain "${file.domain}"` };
    try { d.deserialize(file.data); return { ok: true, domain: file.domain }; } catch { return { ok: false, error: `failed to load "${file.domain}"` }; }
  }
  if (fallbackId) {
    const d = getDomain(fallbackId);
    if (!d) return { ok: false, error: `unknown domain "${fallbackId}"` };
    try { d.deserialize(file); return { ok: true, domain: fallbackId }; } catch { return { ok: false, error: `failed to load "${fallbackId}"` }; }
  }
  return { ok: false, error: 'not a domain file (missing kind/domain)' };
}

export function clearEditorContent(only?: string[]): void {
  for (const d of EDITOR_CONTENT_DOMAINS) {
    if (only && !only.includes(d.id)) continue;
    try { d.clear(); } catch { /* ignore */ }
  }
}

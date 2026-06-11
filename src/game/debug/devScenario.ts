import type { GamePhase } from '../../types/game/state';
import type { TransformationMode } from '../../types/game/transformation';
import type { MissionDefinition } from '../../types/game/mission';
import { useGameStore } from '../../stores/game/useGameStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useFlightStore } from '../../stores/game/useFlightStore';
import { useBaseRuntimeStore } from '../../stores/game/baseRuntimeStore';
import { useFlightRuntimeStore } from '../../stores/game/flightRuntimeStore';
import { useWorldFlightRuntimeStore } from '../../stores/game/worldFlightRuntimeStore';
import { useDestinationRuntimeStore } from '../../stores/game/destinationRuntimeStore';
import { useTransformationPreviewStore } from '../../stores/game/transformationPreviewStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { getEditorCharacters, getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { getEditorMissions, getEditorMission } from '../../stores/game/editorMissionStore';
import { getEditorLocations, getEditorLocation } from '../../stores/game/editorLocationStore';
import { getEditorRoutes, getEditorRoute } from '../../stores/game/editorRouteStore';
import { getEditorTransformations, getEditorTransformation } from '../../stores/game/editorTransformationStore';
import { clearActiveFlightEvents } from '../flight/world/flightEventRuntime';
import { devJumpU } from '../flight/world/worldFlightDev';
import { flightHandle } from '../flight/flightHandle';
import { robotHandle } from '../destination/robotHandle';
import { descentEntry } from '../transformation/descentEntry';

export type DevMissionRuntimeMode = 'auto' | 'none' | 'active' | 'complete' | 'failed';

export interface DevScenarioInput {
  characterId: string | null;
  missionId: string | null;
  locationId: string | null;
  routeId: string | null;
  previousPhase: GamePhase | null;
  routeProgress: number;
  transformationTimelineId: string | null;
  transformationMode: TransformationMode;
  missionRuntimeMode: DevMissionRuntimeMode;
}

export interface ResolvedDevScenario {
  characterId: string | null;
  missionId: string | null;
  locationId: string | null;
  routeId: string | null;
  transformationTimelineId: string | null;
  routeProgress: number;
}

const MISSION_RUNTIME_PHASES = new Set<GamePhase>([
  'MISSION_GAMEPLAY',
  'SUPPORT_SELECTION',
]);

const MISSION_COMPLETE_PHASES = new Set<GamePhase>([
  'MISSION_COMPLETE',
  'RETURN_TRANSFORMATION',
  'RETURN_FLIGHT',
  'BASE_APPROACH',
  'HANGAR_RETURN',
  'MISSION_RESULTS',
]);

const BASE_PHASES = new Set<GamePhase>(['HANGAR', 'PLATFORM_ALIGNMENT', 'LAUNCH_PREPARATION']);
const LOCAL_FLIGHT_PHASES = new Set<GamePhase>(['LAUNCH_TUNNEL', 'BASE_FLY_AROUND', 'CLOUD_ASCENT']);
const WORLD_FLIGHT_PHASES = new Set<GamePhase>(['WORLD_FLIGHT', 'DESTINATION_APPROACH']);
const DESTINATION_PHASES = new Set<GamePhase>(['DESCENT', 'LANDING', 'NPC_GREETING', 'MISSION_GAMEPLAY', 'SUPPORT_SELECTION', 'MISSION_COMPLETE']);

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
}

function pickMission(id: string | null): MissionDefinition | undefined {
  return (id ? getEditorMission(id) : undefined) ?? getEditorMissions()[0];
}

function resolveCharacterId(inputId: string | null, mission: MissionDefinition | undefined): string | null {
  if (inputId && getEditorCharacter(inputId)) return inputId;
  const characters = getEditorCharacters();
  const recommended = mission?.recommendedCharacterIds.find((id) => characters.some((c) => c.id === id));
  return recommended ?? characters[0]?.id ?? null;
}

function resolveRouteId(inputId: string | null, mission: MissionDefinition | undefined): string | null {
  if (inputId && getEditorRoute(inputId)) return inputId;
  if (mission?.routeId && getEditorRoute(mission.routeId)) return mission.routeId;
  return getEditorRoutes()[0]?.id ?? null;
}

function resolveLocationId(inputId: string | null, mission: MissionDefinition | undefined, routeId: string | null): string | null {
  if (inputId && getEditorLocation(inputId)) return inputId;
  if (mission?.locationId && getEditorLocation(mission.locationId)) return mission.locationId;
  const route = routeId ? getEditorRoute(routeId) : undefined;
  if (route?.toLocationId && getEditorLocation(route.toLocationId)) return route.toLocationId;
  return getEditorLocations().find((l) => !l.isBase)?.id ?? getEditorLocations()[0]?.id ?? null;
}

function resolveTransformationTimelineId(inputId: string | null, characterId: string | null): string | null {
  if (inputId && getEditorTransformation(inputId)) return inputId;
  const character = characterId ? getEditorCharacter(characterId) : undefined;
  const timelines = getEditorTransformations();
  if (character?.transformationId && timelines.some((t) => t.id === character.transformationId)) return character.transformationId;
  return timelines.find((t) => t.characterId === characterId)?.id ?? timelines[0]?.id ?? null;
}

export function resolveDevScenario(input: DevScenarioInput): ResolvedDevScenario {
  const mission = pickMission(input.missionId);
  const characterId = resolveCharacterId(input.characterId, mission);
  const routeId = resolveRouteId(input.routeId, mission);
  return {
    characterId,
    missionId: mission?.id ?? null,
    routeId,
    locationId: resolveLocationId(input.locationId, mission, routeId),
    transformationTimelineId: resolveTransformationTimelineId(input.transformationTimelineId, characterId),
    routeProgress: clamp01(input.routeProgress),
  };
}

function runtimeModeForPhase(mode: DevMissionRuntimeMode, phase: GamePhase): Exclude<DevMissionRuntimeMode, 'auto'> {
  if (mode !== 'auto') return mode;
  if (MISSION_COMPLETE_PHASES.has(phase)) return 'complete';
  if (MISSION_RUNTIME_PHASES.has(phase)) return 'active';
  return 'none';
}

function applyMissionRuntime(mission: MissionDefinition | undefined, mode: Exclude<DevMissionRuntimeMode, 'auto'>): void {
  const store = useMissionStore.getState();
  if (!mission) {
    store.reset();
    return;
  }
  store.selectMission(mission.id);
  if (mode === 'none') {
    store.clearRuntime();
    return;
  }
  store.beginMission(mission);
  if (mode === 'complete') store.completeMission();
  if (mode === 'failed') store.failMission();
}

function applyBaseState(phase: GamePhase): void {
  const base = useBaseRuntimeStore.getState();
  base.reset();
  if (phase === 'PLATFORM_ALIGNMENT') base.setProximity(true, false);
  if (phase === 'LAUNCH_PREPARATION') {
    base.setProximity(true, true);
    base.setLocked(true);
    base.setLift('descending', 3);
  }
}

function applyFlightState(phase: GamePhase, progress: number): void {
  useFlightRuntimeStore.getState().reset();
  flightHandle.pos.set(0, LOCAL_FLIGHT_PHASES.has(phase) ? 26 : 90, LOCAL_FLIGHT_PHASES.has(phase) ? 60 : 0);
  flightHandle.speed = 0;
  flightHandle.speedNorm = 0;
  flightHandle.throttle = 0;
  flightHandle.altitude = flightHandle.pos.y;
  flightHandle.routeU = progress;
}

function applyWorldFlightState(progress: number): void {
  clearActiveFlightEvents();
  useWorldFlightRuntimeStore.getState().reset();
  flightHandle.routeU = progress;
  useFlightStore.getState().setProgress(progress);
  devJumpU(progress);
}

function applyDestinationState(phase: GamePhase): void {
  useDestinationRuntimeStore.getState().reset();
  const altitude = phase === 'DESCENT' ? 80 : phase === 'LANDING' ? 2 : 0.8;
  robotHandle.pos.set(0, altitude, 0);
  robotHandle.altitude = altitude;
  robotHandle.vSpeed = phase === 'DESCENT' ? 8 : 0;
  robotHandle.hSpeed = 0;
  robotHandle.heading = 0;
  robotHandle.thrusters = phase === 'DESCENT';
  descentEntry.velocity = phase === 'DESCENT' ? 8 : 2;
  descentEntry.faceCamera = true;
}

function applyTransformationState(timelineId: string | null, mode: TransformationMode): void {
  const preview = useTransformationPreviewStore.getState();
  preview.setTimeline(timelineId);
  preview.setMode(mode);
  preview.scrub(0);
}

export function resetDevScenarioRuntime(): void {
  useBaseRuntimeStore.getState().reset();
  useFlightRuntimeStore.getState().reset();
  clearActiveFlightEvents();
  useWorldFlightRuntimeStore.getState().reset();
  useDestinationRuntimeStore.getState().reset();
  useTransformationPreviewStore.getState().stop();
  useMissionStore.getState().clearRuntime();
  useCharacterStore.getState().clearSupport();
  useSupportRuntimeStore.getState().reset();
}

export function applyDevScenario(input: DevScenarioInput, phase: GamePhase): ResolvedDevScenario {
  const resolved = resolveDevScenario(input);
  resetDevScenarioRuntime();
  if (resolved.characterId) useCharacterStore.getState().selectCharacter(resolved.characterId);
  const mission = resolved.missionId ? getEditorMission(resolved.missionId) : undefined;
  applyMissionRuntime(mission, runtimeModeForPhase(input.missionRuntimeMode, phase));
  useFlightStore.getState().setRoute(resolved.routeId);
  useFlightStore.getState().setLocation(resolved.locationId);
  useFlightStore.getState().setProgress(resolved.routeProgress);

  if (BASE_PHASES.has(phase)) applyBaseState(phase);
  if (LOCAL_FLIGHT_PHASES.has(phase) || WORLD_FLIGHT_PHASES.has(phase)) applyFlightState(phase, resolved.routeProgress);
  if (WORLD_FLIGHT_PHASES.has(phase)) applyWorldFlightState(resolved.routeProgress);
  if (phase === 'TRANSFORMATION' || phase === 'RETURN_TRANSFORMATION') applyTransformationState(resolved.transformationTimelineId, input.transformationMode);
  if (DESTINATION_PHASES.has(phase)) applyDestinationState(phase);

  return resolved;
}

export function jumpToDevScenario(input: DevScenarioInput, phase: GamePhase): ResolvedDevScenario {
  const resolved = applyDevScenario(input, phase);
  useGameStore.getState().jumpTo(phase, input.previousPhase);
  return resolved;
}

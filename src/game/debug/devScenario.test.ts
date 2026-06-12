import { beforeEach, describe, expect, it } from 'vitest';
import { applyDevScenario, jumpToDevScenario, resolveDevScenario, type DevScenarioInput } from './devScenario';
import { getActiveRoute } from '../flight/world/worldRoute';
import { useGameStore } from '../../stores/game/useGameStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useFlightStore } from '../../stores/game/useFlightStore';
import { useWorldFlightRuntimeStore } from '../../stores/game/worldFlightRuntimeStore';
import { useDestinationRuntimeStore } from '../../stores/game/destinationRuntimeStore';
import { useTransformationPreviewStore } from '../../stores/game/transformationPreviewStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { useEditorMissionStore } from '../../stores/game/editorMissionStore';
import { useEditorLocationStore } from '../../stores/game/editorLocationStore';
import { useEditorRouteStore } from '../../stores/game/editorRouteStore';
import { useEditorTransformationStore } from '../../stores/game/editorTransformationStore';
import type { GamePhase } from '../../types/game/state';

const baseInput = (overrides: Partial<DevScenarioInput> = {}): DevScenarioInput => ({
  characterId: null,
  missionId: null,
  locationId: null,
  routeId: null,
  previousPhase: null,
  routeProgress: 0,
  transformationTimelineId: null,
  transformationMode: 'full',
  missionRuntimeMode: 'auto',
  ...overrides,
});

function reseedEditorStores(): void {
  useEditorCharacterStore.getState().reset();
  useEditorMissionStore.getState().reset();
  useEditorLocationStore.getState().reset();
  useEditorRouteStore.getState().reset();
  useEditorTransformationStore.getState().reset();
  useEditorCharacterStore.getState().mergeMissingFromSeed();
  useEditorMissionStore.getState().mergeMissingFromSeed();
  useEditorLocationStore.getState().mergeMissingFromSeed();
  useEditorRouteStore.getState().mergeMissingFromSeed();
  useEditorTransformationStore.getState().mergeMissingFromSeed();
}

function resetRuntimeStores(): void {
  useGameStore.getState().reset();
  useCharacterStore.getState().reset();
  useMissionStore.getState().reset();
  useFlightStore.getState().reset();
  useWorldFlightRuntimeStore.getState().reset();
  useDestinationRuntimeStore.getState().reset();
  useTransformationPreviewStore.getState().stop();
  useSupportRuntimeStore.getState().reset();
}

describe('devScenario', () => {
  beforeEach(() => {
    localStorage.clear();
    reseedEditorStores();
    resetRuntimeStores();
  });

  it('resolves mission defaults for character, location, route, and transformation timeline', () => {
    const resolved = resolveDevScenario(baseInput({ missionId: 'mission_parcel_run' }));

    expect(resolved.missionId).toBe('mission_parcel_run');
    expect(resolved.characterId).toBe('char_jett');
    expect(resolved.locationId).toBe('loc_sunnyharbor');
    expect(resolved.routeId).toBe('route_home_sunnyharbor');
    expect(resolved.transformationTimelineId).toBe('xf_jett');
  });

  it('applies route override so world flight systems read the selected route', () => {
    applyDevScenario(baseInput({ missionId: 'mission_parcel_run', routeId: 'route_home_stormcoast', routeProgress: 0.42 }), 'WORLD_FLIGHT');

    expect(useFlightStore.getState().currentRouteId).toBe('route_home_stormcoast');
    expect(useFlightStore.getState().progress).toBeCloseTo(0.42);
    expect(getActiveRoute()?.id).toBe('route_home_stormcoast');
  });

  it('starts mission runtime when jumping to mission gameplay in auto mode', () => {
    jumpToDevScenario(baseInput({ missionId: 'mission_fix_beacon' }), 'MISSION_GAMEPLAY');

    expect(useGameStore.getState().phase).toBe('MISSION_GAMEPLAY');
    expect(useMissionStore.getState().runtime?.missionId).toBe('mission_fix_beacon');
    expect(useMissionStore.getState().runtime?.status).toBe('active');
  });

  it('initializes control ownership when applying a playable scenario', () => {
    const resolved = jumpToDevScenario(baseInput({ missionId: 'mission_parcel_run', characterId: 'char_jett' }), 'MISSION_GAMEPLAY');

    expect(resolved.characterId).toBe('char_jett');
    expect(useCharacterStore.getState().selectedCharacterId).toBe('char_jett');
    expect(useSupportRuntimeStore.getState().ownership.controlledCharacterId).toBe('char_jett');
    expect(useSupportRuntimeStore.getState().ownership.inputOwnerId).toBe('char_jett');
  });

  it('completes mission runtime when jumping to complete or return phases in auto mode', () => {
    const completePhases: GamePhase[] = ['MISSION_COMPLETE', 'RETURN_FLIGHT'];

    for (const phase of completePhases) {
      jumpToDevScenario(baseInput({ missionId: 'mission_parcel_run' }), phase);
      expect(useGameStore.getState().phase).toBe(phase);
      expect(useMissionStore.getState().runtime?.status).toBe('complete');
    }
  });

  it('records the requested previous phase on a dev scenario jump', () => {
    jumpToDevScenario(baseInput({ previousPhase: 'LANDING' }), 'TRANSFORMATION');

    expect(useGameStore.getState().phase).toBe('TRANSFORMATION');
    expect(useGameStore.getState().previousPhase).toBe('LANDING');
  });
});

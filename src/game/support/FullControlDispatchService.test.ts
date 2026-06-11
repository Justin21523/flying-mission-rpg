import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../stores/game/useGameStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useDestinationRuntimeStore } from '../../stores/game/destinationRuntimeStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { useEditorMissionStore, getEditorMission } from '../../stores/game/editorMissionStore';
import { useEditorSupportStore } from '../../stores/game/editorSupportStore';
import { robotHandle } from '../destination/robotHandle';
import { beginFullControlDispatch, completeFullControlArrival, markFullControlReturning } from './FullControlDispatchService';

function seed(): void {
  localStorage.clear();
  useEditorCharacterStore.getState().reset();
  useEditorMissionStore.getState().reset();
  useEditorSupportStore.getState().reset();
  useEditorCharacterStore.getState().mergeMissingFromSeed();
  useEditorMissionStore.getState().mergeMissingFromSeed();
  useEditorSupportStore.getState().mergeMissingFromSeed();
  useGameStore.getState().reset();
  useCharacterStore.getState().reset();
  useMissionStore.getState().reset();
  useDestinationRuntimeStore.getState().reset();
  useSupportRuntimeStore.getState().reset();
  robotHandle.pos.set(4, 0.8, 5);
  robotHandle.heading = 0.75;
}

describe('FullControlDispatchService', () => {
  beforeEach(seed);

  it('starts full-control dispatch by preserving mission context and moving to hangar', () => {
    const mission = getEditorMission('mission_parcel_run');
    expect(mission).toBeTruthy();
    useCharacterStore.getState().selectCharacter('char_jett');
    useMissionStore.getState().beginMission(mission!);
    useMissionStore.getState().setObjective(mission!.objectives[0].id, true, 1);
    useDestinationRuntimeStore.getState().setCarrying('parcel_a');
    useDestinationRuntimeStore.getState().addCollected('lost_item_a');
    useGameStore.getState().jumpTo('MISSION_GAMEPLAY');

    const result = beginFullControlDispatch('char_paul', 100);

    expect(result.ok).toBe(true);
    expect(useGameStore.getState().phase).toBe('HANGAR');
    expect(useCharacterStore.getState().selectedCharacterId).toBe('char_paul');
    expect(useSupportRuntimeStore.getState().fullControl?.originControlledCharacterId).toBe('char_jett');
    expect(useSupportRuntimeStore.getState().fullControl?.originMissionRuntime?.objectiveProgress[mission!.objectives[0].id].done).toBe(true);
    expect(useSupportRuntimeStore.getState().fullControl?.originDestination.carryingId).toBe('parcel_a');
  });

  it('restores mission context and adds the support character on arrival', () => {
    const mission = getEditorMission('mission_parcel_run')!;
    useCharacterStore.getState().selectCharacter('char_jett');
    useMissionStore.getState().beginMission(mission);
    useMissionStore.getState().setObjective(mission.objectives[0].id, true, 1);
    useDestinationRuntimeStore.getState().setCarrying('parcel_a');
    useGameStore.getState().jumpTo('MISSION_GAMEPLAY');
    beginFullControlDispatch('char_paul', 100);

    markFullControlReturning();
    const restored = completeFullControlArrival();

    expect(restored).toBe(true);
    expect(useMissionStore.getState().runtime?.missionId).toBe('mission_parcel_run');
    expect(useMissionStore.getState().runtime?.objectiveProgress[mission.objectives[0].id].done).toBe(true);
    expect(useDestinationRuntimeStore.getState().carryingId).toBe('parcel_a');
    expect(useSupportRuntimeStore.getState().fullControl).toBeNull();
    expect(useSupportRuntimeStore.getState().presences.some((p) => p.characterId === 'char_paul')).toBe(true);
  });
});

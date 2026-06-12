import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../stores/game/useGameStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useDestinationRuntimeStore } from '../../stores/game/destinationRuntimeStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { useEditorMissionStore, getEditorMission } from '../../stores/game/editorMissionStore';
import { useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import { usePhaserOverlayStore } from '../phaser/phaserBridge';
import { initializeControlOwner } from '../characters/control/ControlOwnershipService';
import { robotHandle } from '../destination/robotHandle';
import { createMissionRuntimeSnapshot, inspectMissionRuntime, restoreMissionRuntimeSnapshot } from './missionRuntimeSnapshot';

function resetAll(): void {
  localStorage.clear();
  useEditorCharacterStore.getState().reset();
  useEditorMissionStore.getState().reset();
  useEditorCharacterStore.getState().mergeMissingFromSeed();
  useEditorMissionStore.getState().mergeMissingFromSeed();
  useGameStore.getState().reset();
  useCharacterStore.getState().reset();
  useMissionStore.getState().reset();
  useDestinationRuntimeStore.getState().reset();
  useSupportRuntimeStore.getState().reset();
  useDialogueStore.getState().endDialogue();
  usePhaserOverlayStore.setState({ openId: null, payload: undefined });
  robotHandle.pos.set(0, 0.8, 0);
  robotHandle.heading = 0;
}

describe('missionRuntimeSnapshot', () => {
  beforeEach(resetAll);

  it('restores mission, destination, support, robot, dialogue, and mini-game state', () => {
    const mission = getEditorMission('mission_parcel_run');
    expect(mission).toBeTruthy();
    useGameStore.getState().jumpTo('MISSION_GAMEPLAY');
    useCharacterStore.getState().selectCharacter('char_jett');
    initializeControlOwner('char_jett');
    useMissionStore.getState().beginMission(mission!);
    useMissionStore.getState().setObjective(mission!.objectives[0].id, true, 1);
    useDestinationRuntimeStore.getState().setCarrying('dst_parcel');
    useDestinationRuntimeStore.getState().addCollected('dst_lost_cap');
    useDestinationRuntimeStore.getState().setInteractionOwner('char_jett');
    useSupportRuntimeStore.getState().upsertPresence({
      characterId: 'char_paul',
      tier: 'active',
      aiState: 'follow-player',
      position: [3, 0.8, 4],
      heading: 1,
      controllerActive: false,
      colliderActive: true,
    });
    robotHandle.pos.set(7, 0.8, -2);
    robotHandle.heading = 0.4;
    usePhaserOverlayStore.setState({ openId: 'repair_wiring', payload: { source: 'test' } });

    const snapshot = createMissionRuntimeSnapshot(1000);
    useGameStore.getState().jumpTo('WORLD_FLIGHT');
    useCharacterStore.getState().selectCharacter('char_paul');
    useMissionStore.getState().reset();
    useDestinationRuntimeStore.getState().reset();
    useSupportRuntimeStore.getState().reset();
    usePhaserOverlayStore.setState({ openId: null, payload: undefined });
    robotHandle.pos.set(0, 0.8, 0);

    const result = restoreMissionRuntimeSnapshot(snapshot);

    expect(result.ok).toBe(true);
    expect(useGameStore.getState().phase).toBe('MISSION_GAMEPLAY');
    expect(useCharacterStore.getState().selectedCharacterId).toBe('char_jett');
    expect(useMissionStore.getState().runtime?.objectiveProgress[mission!.objectives[0].id].done).toBe(true);
    expect(useDestinationRuntimeStore.getState().carryingId).toBe('dst_parcel');
    expect(useDestinationRuntimeStore.getState().collectedIds).toContain('dst_lost_cap');
    expect(useSupportRuntimeStore.getState().ownership.controlledCharacterId).toBe('char_jett');
    expect(useSupportRuntimeStore.getState().presences.some((p) => p.characterId === 'char_paul')).toBe(true);
    expect(robotHandle.pos.x).toBe(7);
    expect(usePhaserOverlayStore.getState().openId).toBe('repair_wiring');
  });

  it('diagnoses owner and stale mini-game mismatches', () => {
    useGameStore.getState().jumpTo('WORLD_FLIGHT');
    useCharacterStore.getState().selectCharacter('char_jett');
    initializeControlOwner('char_jett');
    useSupportRuntimeStore.getState().setOwnership({
      controlledCharacterId: 'char_jett',
      inputOwnerId: 'char_paul',
      cameraOwnerId: 'char_jett',
      hudFocusCharacterId: 'char_jett',
      switching: false,
    });
    useDestinationRuntimeStore.getState().setInteractionOwner('char_paul');
    usePhaserOverlayStore.setState({ openId: 'repair_wiring', payload: undefined });

    const diagnostics = inspectMissionRuntime();

    expect(diagnostics.ok).toBe(false);
    expect(diagnostics.warnings).toContain('Input owner does not match the controlled character.');
    expect(diagnostics.warnings).toContain('Interaction prompt owner does not match the controlled character.');
    expect(diagnostics.warnings).toContain('A mini-game is open outside mission gameplay.');
  });
});

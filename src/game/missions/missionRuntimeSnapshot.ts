import { useGameStore } from '../../stores/game/useGameStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useDestinationRuntimeStore, type DestinationRuntimeSnapshot } from '../../stores/game/destinationRuntimeStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import { usePhaserOverlayStore } from '../phaser/phaserBridge';
import { robotHandle } from '../destination/robotHandle';
import type { MissionRuntime } from '../../types/game/mission';
import type { GamePhase } from '../../types/game/state';
import type { CharacterPresence, ControlOwnershipState, SupportDispatchEntry } from '../../types/game/support';

export interface MissionRuntimeSnapshot {
  id: string;
  createdAtMs: number;
  phase: GamePhase;
  previousPhase: GamePhase | null;
  selectedCharacterId: string | null;
  missionId: string | null;
  missionRuntime: MissionRuntime | null;
  destinationRuntime: DestinationRuntimeSnapshot;
  ownership: ControlOwnershipState;
  presences: CharacterPresence[];
  dispatches: SupportDispatchEntry[];
  robotPose: {
    position: [number, number, number];
    heading: number;
  };
  dialogue: {
    isActive: boolean;
    currentTreeId: string | null;
    currentNodeId: string | null;
  };
  miniGame: {
    openId: string | null;
    payload?: Record<string, string>;
  };
}

export interface MissionRuntimeDiagnostics {
  ok: boolean;
  warnings: string[];
  phase: GamePhase;
  missionId: string | null;
  missionStatus: string;
  controlledCharacterId: string | null;
  inputOwnerId: string | null;
  cameraOwnerId: string | null;
  promptOwnerId: string | null;
  miniGameOpenId: string | null;
  dialogueTreeId: string | null;
  activePresenceCount: number;
  standbyPresenceCount: number;
  remotePresenceCount: number;
  dispatchCount: number;
}

export interface MissionRuntimeRestoreResult {
  ok: boolean;
  warnings: string[];
}

function cloneMissionRuntime(runtime: MissionRuntime | null): MissionRuntime | null {
  if (!runtime) return null;
  const objectiveProgress: MissionRuntime['objectiveProgress'] = {};
  for (const [key, value] of Object.entries(runtime.objectiveProgress)) {
    objectiveProgress[key] = { ...value };
  }
  return { ...runtime, objectiveProgress };
}

function clonePresence(presence: CharacterPresence): CharacterPresence {
  return {
    ...presence,
    position: [presence.position[0], presence.position[1], presence.position[2]],
    taskTarget: presence.taskTarget ? [presence.taskTarget[0], presence.taskTarget[1]] : undefined,
  };
}

function cloneDispatch(dispatch: SupportDispatchEntry): SupportDispatchEntry {
  return { ...dispatch };
}

function snapshotId(createdAtMs: number): string {
  return `mission_snapshot_${createdAtMs.toString(36)}`;
}

export function createMissionRuntimeSnapshot(nowMs = Date.now()): MissionRuntimeSnapshot {
  const game = useGameStore.getState();
  const character = useCharacterStore.getState();
  const mission = useMissionStore.getState();
  const destination = useDestinationRuntimeStore.getState();
  const support = useSupportRuntimeStore.getState();
  const dialogue = useDialogueStore.getState();
  const miniGame = usePhaserOverlayStore.getState();
  return {
    id: snapshotId(nowMs),
    createdAtMs: nowMs,
    phase: game.phase,
    previousPhase: game.previousPhase,
    selectedCharacterId: character.selectedCharacterId,
    missionId: mission.currentMissionId,
    missionRuntime: cloneMissionRuntime(mission.runtime),
    destinationRuntime: destination.snapshot(),
    ownership: { ...support.ownership },
    presences: support.presences.map(clonePresence),
    dispatches: support.dispatches.map(cloneDispatch),
    robotPose: {
      position: [robotHandle.pos.x, robotHandle.pos.y, robotHandle.pos.z],
      heading: robotHandle.heading,
    },
    dialogue: {
      isActive: dialogue.isActive,
      currentTreeId: dialogue.currentTreeId,
      currentNodeId: dialogue.currentNodeId,
    },
    miniGame: {
      openId: miniGame.openId,
      payload: miniGame.payload ? { ...miniGame.payload } : undefined,
    },
  };
}

export function restoreMissionRuntimeSnapshot(snapshot: MissionRuntimeSnapshot): MissionRuntimeRestoreResult {
  const warnings: string[] = [];
  useGameStore.getState().jumpTo(snapshot.phase, snapshot.previousPhase);
  useCharacterStore.getState().selectCharacter(snapshot.selectedCharacterId);
  useMissionStore.setState({
    currentMissionId: snapshot.missionId,
    runtime: cloneMissionRuntime(snapshot.missionRuntime),
  });
  useDestinationRuntimeStore.getState().restore(snapshot.destinationRuntime);
  useSupportRuntimeStore.setState({
    ownership: { ...snapshot.ownership },
    presences: snapshot.presences.map(clonePresence),
    dispatches: snapshot.dispatches.map(cloneDispatch),
  });
  robotHandle.pos.set(snapshot.robotPose.position[0], snapshot.robotPose.position[1], snapshot.robotPose.position[2]);
  robotHandle.heading = snapshot.robotPose.heading;
  useDialogueStore.setState({
    isActive: snapshot.dialogue.isActive,
    currentTreeId: snapshot.dialogue.currentTreeId,
    currentNodeId: snapshot.dialogue.currentNodeId,
  });
  usePhaserOverlayStore.setState({
    openId: snapshot.miniGame.openId,
    payload: snapshot.miniGame.payload ? { ...snapshot.miniGame.payload } : undefined,
  });
  const diagnostics = inspectMissionRuntime();
  if (!diagnostics.ok) warnings.push(...diagnostics.warnings);
  return { ok: warnings.length === 0, warnings };
}

export function inspectMissionRuntime(): MissionRuntimeDiagnostics {
  const game = useGameStore.getState();
  const mission = useMissionStore.getState();
  const destination = useDestinationRuntimeStore.getState();
  const support = useSupportRuntimeStore.getState();
  const dialogue = useDialogueStore.getState();
  const miniGame = usePhaserOverlayStore.getState();
  const controlledCharacterId = support.ownership.controlledCharacterId ?? useCharacterStore.getState().selectedCharacterId;
  const warnings: string[] = [];

  if (support.ownership.inputOwnerId && controlledCharacterId && support.ownership.inputOwnerId !== controlledCharacterId) {
    warnings.push('Input owner does not match the controlled character.');
  }
  if (support.ownership.cameraOwnerId && controlledCharacterId && support.ownership.cameraOwnerId !== controlledCharacterId) {
    warnings.push('Camera owner does not match the controlled character.');
  }
  if (destination.interactionOwnerId && controlledCharacterId && destination.interactionOwnerId !== controlledCharacterId) {
    warnings.push('Interaction prompt owner does not match the controlled character.');
  }
  if (mission.runtime && mission.currentMissionId && mission.runtime.missionId !== mission.currentMissionId) {
    warnings.push('Mission runtime id does not match the selected mission.');
  }
  if (game.phase === 'MISSION_GAMEPLAY' && mission.currentMissionId && !mission.runtime) {
    warnings.push('Mission gameplay has a selected mission but no active runtime.');
  }
  if (miniGame.openId && game.phase !== 'MISSION_GAMEPLAY') {
    warnings.push('A mini-game is open outside mission gameplay.');
  }
  const activePresenceCount = support.presences.filter((p) => p.tier === 'active').length;
  const standbyPresenceCount = support.presences.filter((p) => p.tier === 'standby').length;
  const remotePresenceCount = support.presences.filter((p) => p.tier === 'remote').length;

  return {
    ok: warnings.length === 0,
    warnings,
    phase: game.phase,
    missionId: mission.currentMissionId,
    missionStatus: mission.runtime?.status ?? 'none',
    controlledCharacterId,
    inputOwnerId: support.ownership.inputOwnerId,
    cameraOwnerId: support.ownership.cameraOwnerId,
    promptOwnerId: destination.interactionOwnerId,
    miniGameOpenId: miniGame.openId,
    dialogueTreeId: dialogue.currentTreeId,
    activePresenceCount,
    standbyPresenceCount,
    remotePresenceCount,
    dispatchCount: support.dispatches.length,
  };
}

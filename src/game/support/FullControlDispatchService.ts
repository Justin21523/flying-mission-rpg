import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useDestinationRuntimeStore } from '../../stores/game/destinationRuntimeStore';
import { getSupportProfileForCharacter, getMultiCharacterLimits } from '../../stores/game/editorSupportStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { useFlightStore } from '../../stores/game/useFlightStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { gameEventBus } from '../core/EventBus';
import { robotHandle } from '../destination/robotHandle';
import { addCharacterPresence } from '../characters/runtime/MultiCharacterManager';
import { switchControlToCharacter } from '../characters/control/ControlOwnershipService';
import { supportArrivalPresence } from './SupportArrivalSimulator';
import { requestSupport } from './SupportDispatchDirector';
import type { FullControlDispatchContext } from '../../types/game/support';

export function beginFullControlDispatch(characterId: string, nowMs = performance.now()): { ok: boolean; reason?: string } {
  const profile = getSupportProfileForCharacter(characterId);
  if (!profile) return { ok: false, reason: 'Support profile does not exist.' };
  const selected = useCharacterStore.getState().selectedCharacterId;
  const originControlled = useSupportRuntimeStore.getState().ownership.controlledCharacterId ?? selected;
  if (!originControlled) return { ok: false, reason: 'No controlled character is active.' };
  const supportRequest = requestSupport(characterId, 'full-control', nowMs);
  if (!supportRequest.ok) return supportRequest;

  const mission = useMissionStore.getState();
  const context: FullControlDispatchContext = {
    dispatchCharacterId: characterId,
    originControlledCharacterId: originControlled,
    originPhase: useGameStore.getState().phase,
    originMissionId: mission.currentMissionId,
    originMissionRuntime: mission.runtime ? { ...mission.runtime, objectiveProgress: { ...mission.runtime.objectiveProgress } } : null,
    originDestination: useDestinationRuntimeStore.getState().snapshot(),
    originPresences: useSupportRuntimeStore.getState().presences.map((p) => ({ ...p, position: [p.position[0], p.position[1], p.position[2]] })),
    originRobotPosition: [robotHandle.pos.x, robotHandle.pos.y, robotHandle.pos.z],
    originRobotHeading: robotHandle.heading,
    returnPhase: 'MISSION_GAMEPLAY',
    startedAtMs: nowMs,
    returning: false,
  };

  useSupportRuntimeStore.getState().setFullControl(context);
  switchControlToCharacter(characterId);
  useFlightStore.getState().setProgress(0);
  useSupportRuntimeStore.getState().setPanelOpen(false);
  const moved = useGameStore.getState().requestTransition('HANGAR');
  if (!moved) useGameStore.getState().jumpTo('HANGAR', context.originPhase);
  useSupportRuntimeStore.getState().pushToast(characterId, `${getEditorCharacter(characterId)?.name ?? characterId} launching`);
  return { ok: true };
}

export function markFullControlReturning(): void {
  const context = useSupportRuntimeStore.getState().fullControl;
  if (!context || context.returning) return;
  useSupportRuntimeStore.getState().setFullControl({ ...context, returning: true });
}

export function completeFullControlArrival(): boolean {
  const runtime = useSupportRuntimeStore.getState();
  const context = runtime.fullControl;
  if (!context || !context.returning) return false;
  const mission = useMissionStore.getState();
  mission.selectMission(context.originMissionId);
  if (context.originMissionRuntime) useMissionStore.setState({ runtime: context.originMissionRuntime });
  useDestinationRuntimeStore.getState().restore(context.originDestination);

  const arrived = supportArrivalPresence(context.dispatchCharacterId, 'active');
  const mergedPresences = addCharacterPresence(runtime.presences, arrived, getMultiCharacterLimits(), context.dispatchCharacterId);
  useSupportRuntimeStore.setState({
    presences: mergedPresences,
    dispatches: runtime.dispatches.filter((d) => d.characterId !== context.dispatchCharacterId),
    fullControl: null,
  });
  useCharacterStore.getState().addSupport({ characterId: context.dispatchCharacterId, status: mergedPresences.find((p) => p.characterId === context.dispatchCharacterId)?.tier ?? 'active' });
  useSupportRuntimeStore.getState().pushToast(context.dispatchCharacterId, `${getEditorCharacter(context.dispatchCharacterId)?.name ?? context.dispatchCharacterId} arrived`);
  gameEventBus.emit('support:arrived', { characterId: context.dispatchCharacterId });
  return true;
}

export function cancelFullControlDispatch(reason = 'Full-control dispatch cancelled'): void {
  const context = useSupportRuntimeStore.getState().fullControl;
  if (!context) return;
  useSupportRuntimeStore.getState().setFullControl(null);
  gameEventBus.emit('support:cancelled', { characterId: context.dispatchCharacterId, reason });
}

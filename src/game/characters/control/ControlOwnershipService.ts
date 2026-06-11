import { useCharacterStore } from '../../../stores/game/useCharacterStore';
import { useSupportRuntimeStore } from '../../../stores/game/supportRuntimeStore';
import { getMultiCharacterLimits } from '../../../stores/game/editorSupportStore';
import { gameEventBus } from '../../core/EventBus';
import { robotHandle } from '../../destination/robotHandle';
import { createOwnershipState } from '../runtime/CharacterOwnershipController';
import { rebalanceTiers } from '../runtime/CharacterTierManager';
import type { CharacterPresence } from '../../../types/game/support';

function currentPlayerPresence(characterId: string): CharacterPresence {
  return {
    characterId,
    tier: 'active',
    aiState: 'follow-player',
    position: [robotHandle.pos.x, robotHandle.pos.y, robotHandle.pos.z],
    heading: robotHandle.heading,
    controllerActive: false,
    colliderActive: true,
  };
}

export function switchControlToCharacter(toCharacterId: string): boolean {
  const runtime = useSupportRuntimeStore.getState();
  const fromCharacterId = runtime.ownership.controlledCharacterId ?? useCharacterStore.getState().selectedCharacterId;
  if (!toCharacterId || fromCharacterId === toCharacterId) return false;
  let presences = runtime.presences;
  if (fromCharacterId && !presences.some((p) => p.characterId === fromCharacterId)) presences = [...presences, currentPlayerPresence(fromCharacterId)];
  const target = presences.find((p) => p.characterId === toCharacterId);
  if (target) {
    robotHandle.pos.set(target.position[0], Math.max(0.8, target.position[1]), target.position[2]);
    robotHandle.heading = target.heading;
  }
  const nextOwnership = createOwnershipState(toCharacterId, runtime.ownership);
  useSupportRuntimeStore.setState({
    ownership: nextOwnership,
    presences: rebalanceTiers(presences.map((p) => (
      p.characterId === toCharacterId ? { ...p, aiState: 'idle', controllerActive: true } : { ...p, aiState: p.aiState === 'idle' ? 'follow-player' : p.aiState, controllerActive: false }
    )), getMultiCharacterLimits(), toCharacterId),
  });
  useCharacterStore.getState().selectCharacter(toCharacterId);
  if (fromCharacterId) gameEventBus.emit('control:switched', { fromCharacterId, toCharacterId });
  return true;
}

export function initializeControlOwner(characterId: string | null): void {
  if (!characterId) return;
  const runtime = useSupportRuntimeStore.getState();
  if (runtime.ownership.controlledCharacterId) return;
  useSupportRuntimeStore.getState().setOwnership(createOwnershipState(characterId, runtime.ownership));
}

import { getDestinationParts } from '../../stores/game/editorDestinationStore';
import type { CharacterPresence, CompanionAiState } from '../../types/game/support';
import { robotHandle } from '../destination/robotHandle';

function candidateSpawn(): [number, number, number] {
  const parts = getDestinationParts().filter((p) => p.enabled);
  const support = parts.find((p) => p.kind === 'support_spawn');
  if (support) return support.position;
  const safe = parts.find((p) => p.kind === 'safe_zone') ?? parts.find((p) => p.kind === 'landing_zone');
  if (safe) {
    const r = Math.max(3, safe.radius ?? Math.max(safe.size[0], safe.size[2]) / 2);
    return [safe.position[0] + r * 0.75, Math.max(0.8, safe.position[1]), safe.position[2] + r * 0.35];
  }
  return [robotHandle.pos.x + 5, Math.max(0.8, robotHandle.pos.y), robotHandle.pos.z + 3];
}

export function supportArrivalPresence(characterId: string, tier: CharacterPresence['tier'], aiState: CompanionAiState = 'follow-player'): CharacterPresence {
  return {
    characterId,
    tier,
    aiState,
    position: candidateSpawn(),
    heading: 0,
    controllerActive: false,
    colliderActive: tier !== 'remote',
  };
}

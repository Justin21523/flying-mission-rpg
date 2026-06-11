import type { CharacterPresence, SupportAiProfile } from '../../../types/game/support';
import { applySeparation } from './CompanionAvoidanceController';
import { followSlot, moveToward2D, type Vec2 } from './CompanionNavigationAgent';
import { nextAiState } from './CompanionAiStateMachine';

export function updateCompanionAi(
  presence: CharacterPresence,
  ai: SupportAiProfile,
  player: Vec2,
  others: readonly Vec2[],
  index: number,
  dt: number,
  hasAssistTask: boolean,
): CharacterPresence {
  if (presence.tier === 'remote') return presence;
  const current = { x: presence.position[0], z: presence.position[2] };
  const target = presence.aiState === 'standby'
    ? followSlot(player, index, ai.standbyDistance)
    : followSlot(player, index, ai.followDistance);
  const separated = applySeparation(current, others, ai.avoidanceRadius, 0.45);
  const tooClose = Math.hypot(current.x - player.x, current.z - player.z) < Math.max(1, ai.avoidanceRadius);
  const state = nextAiState(presence.aiState, hasAssistTask && ai.assistBehaviorEnabled, tooClose, false);
  const moved = moveToward2D(separated, target, ai.moveSpeed, dt);
  const heading = Math.atan2(player.x - moved.x, player.z - moved.z);
  return {
    ...presence,
    aiState: state === 'avoid-obstacle' ? 'follow-player' : state,
    position: [moved.x, presence.position[1], moved.z],
    heading,
  };
}

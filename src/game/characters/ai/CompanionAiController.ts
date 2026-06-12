import type { CharacterPresence, SupportAiProfile } from '../../../types/game/support';
import { applyAvoidance, type AvoidZone } from './CompanionAvoidanceController';
import { followSlot, moveToward2D, type Vec2 } from './CompanionNavigationAgent';

// Autonomous companion AI. With a task (taskObjectiveId + taskTarget) the companion NAVIGATES to the objective,
// arrives, "works" for WORK_TIME, then signals completion (completedObjectiveId) and clears the task. With no
// task it follows the player in a formation slot. Pure → unit-testable; the host applies the completion.
export interface CompanionAiResult {
  presence: CharacterPresence;
  completedObjectiveId?: string;
}

const ARRIVE_DIST = 2.4; // how close counts as "at the objective"
const WORK_TIME = 1.6; // seconds of working before the objective is completed

export function updateCompanionAi(
  presence: CharacterPresence,
  ai: SupportAiProfile,
  player: Vec2,
  others: readonly Vec2[],
  zones: readonly AvoidZone[],
  index: number,
  dt: number,
): CompanionAiResult {
  if (presence.tier === 'remote') return { presence };
  const cur: Vec2 = { x: presence.position[0], z: presence.position[2] };

  // ── task-driven: go to the objective and work it ──
  if (presence.taskObjectiveId && presence.taskTarget) {
    const tx = presence.taskTarget[0];
    const tz = presence.taskTarget[1];
    const dist = Math.hypot(cur.x - tx, cur.z - tz);
    if (dist <= ARRIVE_DIST) {
      const workElapsed = (presence.workElapsed ?? 0) + dt;
      const heading = Math.atan2(tx - cur.x, tz - cur.z);
      if (workElapsed >= WORK_TIME) {
        return {
          presence: { ...presence, aiState: 'follow-player', heading, workElapsed: 0, taskObjectiveId: undefined, taskTarget: undefined },
          completedObjectiveId: presence.taskObjectiveId,
        };
      }
      return { presence: { ...presence, aiState: 'assist-objective', heading, workElapsed } };
    }
    // steer toward the objective; separate from peers only (NOT the target zone we're heading into)
    const separated = applyAvoidance(cur, others, [], ai.avoidanceRadius, 0.4);
    const moved = moveToward2D(separated, { x: tx, z: tz }, ai.moveSpeed, dt);
    const heading = Math.atan2(tx - moved.x, tz - moved.z);
    return { presence: { ...presence, aiState: 'move-to-point', position: [moved.x, presence.position[1], moved.z], heading, workElapsed: 0 } };
  }

  // ── no task: follow the player in a formation slot (avoid peers + zones) ──
  const slot = followSlot(player, index, presence.tier === 'standby' ? ai.standbyDistance : ai.followDistance);
  const separated = applyAvoidance(cur, others, zones, ai.avoidanceRadius, 0.45);
  const moved = moveToward2D(separated, slot, ai.moveSpeed, dt);
  const heading = Math.atan2(player.x - moved.x, player.z - moved.z);
  return { presence: { ...presence, aiState: presence.tier === 'standby' ? 'standby' : 'follow-player', position: [moved.x, presence.position[1], moved.z], heading } };
}

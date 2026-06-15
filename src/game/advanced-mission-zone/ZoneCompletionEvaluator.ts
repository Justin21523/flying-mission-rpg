import type {
  ZoneSegmentDefinition,
  ZoneConditionDefinition,
  ZoneConditionProgress,
} from '../../types/game/advancedMissionZone';
import { FUTURE_CONDITION_TYPES } from '../../types/game/advancedMissionZone';

// World snapshot the evaluator needs. Passed in (not read from stores) so this stays pure + unit-testable.
export interface ZoneWorldProbe {
  playerPos: { x: number; z: number };
  nowMs: number;
  segmentStartedAtMs: number;
  completedObjectiveIds: Set<string>;
  interactedObjectIds: Set<string>;
  clearedAreaIds: Set<string>;
  completedSegmentIds: Set<string>;
  godMode: boolean;
}

function dist2(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}

// Evaluate one condition → progress (done + current/total). God-mode satisfies every condition (so debug
// flow + the debug "complete segment" button never get stuck on future/combat placeholders).
export function evaluateCondition(
  condition: ZoneConditionDefinition,
  segment: ZoneSegmentDefinition,
  probe: ZoneWorldProbe,
): ZoneConditionProgress {
  const doneResult = (done: boolean, current = done ? 1 : 0, total = 1): ZoneConditionProgress => ({
    conditionId: condition.id,
    done,
    current,
    total,
  });

  if (probe.godMode) return doneResult(true);

  switch (condition.type) {
    case 'always':
      return doneResult(true);

    case 'debug-complete':
      return doneResult(false); // only via god-mode / the debug complete button

    case 'reach-marker': {
      const marker = segment.markers.find((m) => m.id === condition.markerId);
      if (!marker) return doneResult(false);
      const r = condition.radius || marker.radius || 3;
      const within = dist2(probe.playerPos.x, probe.playerPos.z, marker.position[0], marker.position[2]) <= r * r;
      return doneResult(within);
    }

    case 'interact-with-object':
      return doneResult(probe.interactedObjectIds.has(condition.objectId));

    case 'placeholder-clear-area':
      return doneResult(probe.clearedAreaIds.has(condition.areaId));

    case 'complete-existing-objective':
      return doneResult(probe.completedObjectiveIds.has(condition.objectiveId));

    case 'segment-completed':
      return doneResult(probe.completedSegmentIds.has(condition.segmentId));

    case 'wait-seconds': {
      const elapsed = Math.max(0, (probe.nowMs - probe.segmentStartedAtMs) / 1000);
      return {
        conditionId: condition.id,
        done: elapsed >= condition.seconds,
        current: Math.min(condition.seconds, Math.round(elapsed * 10) / 10),
        total: condition.seconds,
      };
    }

    default:
      // future-* placeholders: never satisfiable in play (only via god-mode, handled above).
      if (FUTURE_CONDITION_TYPES.includes(condition.type)) return doneResult(false);
      return doneResult(false);
  }
}

export interface SegmentEvaluation {
  progress: Record<string, ZoneConditionProgress>;
  complete: boolean;
}

// Evaluate all completion conditions of a segment (AND across conditions).
export function evaluateSegmentCompletion(segment: ZoneSegmentDefinition, probe: ZoneWorldProbe): SegmentEvaluation {
  const progress: Record<string, ZoneConditionProgress> = {};
  let complete = segment.completionConditions.length > 0;
  for (const c of segment.completionConditions) {
    const p = evaluateCondition(c, segment, probe);
    progress[c.id] = p;
    if (!p.done) complete = false;
  }
  return { progress, complete };
}

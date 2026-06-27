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
  // Batch C — enemy/obstacle encounter state.
  clearedEnemyGroupIds?: Set<string>;
  enemyGroupRemaining?: Record<string, { remaining: number; total: number }>;
  destroyedObstacleIds?: Set<string>;
  clearedObstacleIds?: Set<string>;
  repairedDeviceIds?: Set<string>;
  // Batch E — support-combat events recorded by SupportZoneConditionAdapter.
  usedSupportAbilityIds?: Set<string>;
  supportRepairedDeviceIds?: Set<string>;
  supportClearedObstacleIds?: Set<string>;
  supportScannedTargetIds?: Set<string>;
  protectedAreaSeconds?: Record<string, number>;
  // Batch F — boss-encounter events recorded by BossZoneConditionAdapter.
  defeatedBossIds?: Set<string>;
  completedBossPhaseIds?: Set<string>; // `${bossId}:${phaseId}`
  destroyedBossWeakpointIds?: Set<string>; // `${bossId}:${weakpointId}`
  clearedBossWaveIds?: Set<string>; // `${bossId}:${waveId}`
  // Batch G — AI incident events recorded by IncidentZoneAdapter.
  resolvedIncidentIds?: Set<string>;
  completedIncidentObjectiveIds?: Set<string>; // `${incidentId}:${objectiveStepId}`
  failedIncidentIds?: Set<string>;
  // Batch O — mission-type objectives driven by MissionObjectiveHost (completion flag + live progress per condition id).
  completedMissionObjectiveIds?: Set<string>;
  missionObjectiveProgress?: Record<string, { current: number; total: number; label?: string }>;
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

    // Batch C — enemy/obstacle conditions (the future-* aliases resolve the same way).
    case 'defeat-enemy-group':
    case 'future-defeat-enemy-group': {
      const gid = condition.enemyGroupId;
      const rem = probe.enemyGroupRemaining?.[gid];
      const done = probe.clearedEnemyGroupIds?.has(gid) ?? false;
      if (rem) return { conditionId: condition.id, done: done || rem.remaining === 0, current: rem.total - rem.remaining, total: Math.max(1, rem.total) };
      return doneResult(done);
    }
    case 'destroy-obstacle':
    case 'future-destroy-obstacle':
      return doneResult(probe.destroyedObstacleIds?.has(condition.obstacleId) ?? false);
    case 'clear-obstacle':
      return doneResult(probe.clearedObstacleIds?.has(condition.obstacleId) ?? false);
    case 'repair-device':
    case 'future-repair-device':
      return doneResult(probe.repairedDeviceIds?.has(condition.deviceId) ?? false);

    // Batch E — support-combat conditions.
    case 'use-support-ability': {
      const used = probe.usedSupportAbilityIds;
      if (!used) return doneResult(false);
      if (condition.targetId) return doneResult(used.has(`${condition.abilityId}:${condition.targetId}`));
      return doneResult(used.has(condition.abilityId));
    }
    case 'support-repair-device':
      return doneResult((probe.supportRepairedDeviceIds?.has(condition.deviceId) ?? false) || (probe.repairedDeviceIds?.has(condition.deviceId) ?? false));
    case 'support-clear-obstacle':
      return doneResult((probe.supportClearedObstacleIds?.has(condition.obstacleId) ?? false) || (probe.clearedObstacleIds?.has(condition.obstacleId) ?? false) || (probe.destroyedObstacleIds?.has(condition.obstacleId) ?? false));
    case 'support-scan-target':
      return doneResult(probe.supportScannedTargetIds?.has(condition.targetId) ?? false);
    case 'support-protect-area': {
      const secs = probe.protectedAreaSeconds?.[condition.areaId] ?? 0;
      return { conditionId: condition.id, done: secs >= condition.seconds, current: Math.min(condition.seconds, Math.round(secs * 10) / 10), total: condition.seconds };
    }

    // Batch F — boss conditions.
    case 'defeat-boss':
      return doneResult(probe.defeatedBossIds?.has(condition.bossId) ?? false);
    case 'complete-boss-phase':
      return doneResult(probe.completedBossPhaseIds?.has(`${condition.bossId}:${condition.phaseId}`) ?? false);
    case 'destroy-boss-weakpoint':
      return doneResult(probe.destroyedBossWeakpointIds?.has(`${condition.bossId}:${condition.weakpointId}`) ?? false);
    case 'clear-boss-summon-wave':
      return doneResult(probe.clearedBossWaveIds?.has(`${condition.bossId}:${condition.waveId}`) ?? false);

    // Batch G — AI incident conditions.
    case 'resolve-incident':
    case 'incident-success':
      return doneResult(probe.resolvedIncidentIds?.has(condition.incidentId) ?? false);
    case 'complete-incident-objective':
      return doneResult(probe.completedIncidentObjectiveIds?.has(`${condition.incidentId}:${condition.objectiveStepId}`) ?? false);
    case 'incident-failed':
      return doneResult(probe.failedIncidentIds?.has(condition.incidentId) ?? false);

    // Batch O — mission-type objectives: the host owns the mechanic + writes done/progress here.
    case 'defense-waves':
    case 'timed-rescue':
    case 'scan-targets':
    // Wave 3 — additional mission-type objectives (same store-progress contract).
    case 'escort-npc':
    case 'hold-zone':
    case 'survive-timer':
    case 'hack-terminals': {
      const done = probe.completedMissionObjectiveIds?.has(condition.id) ?? false;
      const p = probe.missionObjectiveProgress?.[condition.id];
      return { conditionId: condition.id, done, current: done ? (p?.total ?? 1) : (p?.current ?? 0), total: p?.total ?? 1 };
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

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../stores/game/useGameStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { robotHandle } from '../destination/robotHandle';
import { evaluateSegmentCompletion } from './ZoneCompletionEvaluator';
import type { ZoneWorldProbe } from './ZoneCompletionEvaluator';
import { activeSegment, beginFirstSegment, completeCurrentSegment, transitionToNextSegment } from './AdvancedMissionZoneDirector';
import { clearedGroupIds, groupRemaining } from '../combat/enemySpawnDirector';
import { destroyedObstacleIds, clearedObstacleIds, repairedObstacleIds } from '../obstacles/ObstacleDirector';
import { update as updateIncidents } from '../incidents/AIIncidentDirector';

// Drives the active Advanced Mission Zone each frame: enters the first segment, evaluates completion
// conditions against the live robot position / objective progress, records proximity interactions and
// area clears, and gates the ZONE_COMPLETE toast before advancing. Mounted inside DestinationScene (so
// useFrame + robotHandle are live). Pure logic lives in the evaluator + director; this is just the pump.
const ZONE_COMPLETE_TOAST_SEC = 1.6;

function buildProbe(nowMs: number): ZoneWorldProbe {
  const z = useAdvancedMissionZoneStore.getState();
  const rt = useMissionStore.getState().runtime;
  const completedObjectiveIds = new Set<string>();
  if (rt) for (const [id, p] of Object.entries(rt.objectiveProgress)) if (p.done) completedObjectiveIds.add(id);
  // Enemy-group remaining counts for the active segment's defeat conditions.
  const seg = activeSegment();
  const enemyGroupRemaining: Record<string, { remaining: number; total: number }> = {};
  for (const gid of seg?.placeholderEnemyGroupIds ?? []) enemyGroupRemaining[gid] = groupRemaining(gid);
  return {
    playerPos: { x: robotHandle.pos.x, z: robotHandle.pos.z },
    nowMs,
    segmentStartedAtMs: z.segmentStartedAtMs ?? nowMs,
    completedObjectiveIds,
    interactedObjectIds: new Set(z.interactedObjectIds),
    clearedAreaIds: new Set(z.clearedAreaIds),
    completedSegmentIds: new Set(z.completedSegmentIds),
    godMode: z.debug.godMode,
    clearedEnemyGroupIds: clearedGroupIds(),
    enemyGroupRemaining,
    destroyedObstacleIds: destroyedObstacleIds(),
    clearedObstacleIds: clearedObstacleIds(),
    repairedDeviceIds: repairedObstacleIds(),
    // Batch E — support-combat recorded events.
    usedSupportAbilityIds: new Set(z.usedSupportAbilityIds),
    supportRepairedDeviceIds: new Set(z.supportRepairedDeviceIds),
    supportClearedObstacleIds: new Set(z.supportClearedObstacleIds),
    supportScannedTargetIds: new Set(z.supportScannedTargetIds),
    protectedAreaSeconds: z.protectedAreaSeconds,
    // Batch F — boss-encounter recorded events.
    defeatedBossIds: new Set(z.defeatedBossIds),
    completedBossPhaseIds: new Set(z.completedBossPhaseIds),
    destroyedBossWeakpointIds: new Set(z.destroyedBossWeakpointIds),
    clearedBossWaveIds: new Set(z.clearedBossWaveIds),
    // Batch G — AI incident recorded events.
    resolvedIncidentIds: new Set(z.resolvedIncidentIds),
    completedIncidentObjectiveIds: new Set(z.completedIncidentObjectiveIds),
    failedIncidentIds: new Set(z.failedIncidentIds),
  };
}

export const AdvancedMissionZoneDirectorHost = () => {
  const toastT = useRef(0);

  // [E] interaction: when near an objective/core marker of the active segment, record its interaction so
  // interact-with-object conditions complete. (reach/clear conditions are handled in the frame loop.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' && e.code !== 'Enter') return;
      if (useGameStore.getState().phase !== 'ZONE_SEGMENT_GAMEPLAY') return;
      const seg = activeSegment();
      if (!seg) return;
      const px = robotHandle.pos.x;
      const pz = robotHandle.pos.z;
      for (const m of seg.markers) {
        if (m.type !== 'objective' && m.type !== 'core') continue;
        const r = m.radius ?? 3;
        const dx = px - m.position[0];
        const dz = pz - m.position[2];
        if (dx * dx + dz * dz <= r * r) {
          useAdvancedMissionZoneStore.getState().recordInteraction(m.id);
          break;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useFrame((_, dt) => {
    const phase = useGameStore.getState().phase;

    if (phase === 'ADVANCED_MISSION_ZONE') {
      beginFirstSegment();
      toastT.current = 0;
      return;
    }

    if (phase === 'ZONE_SEGMENT_GAMEPLAY') {
      const seg = activeSegment();
      if (!seg) return;
      // Batch G — pump the AI incident runtime (objectives / escalation / completion) each frame.
      updateIncidents(dt);
      const probe = buildProbe(typeof performance !== 'undefined' ? performance.now() : Date.now());

      // placeholder-clear-area: auto-clear once the player stands in the referenced marker's radius.
      for (const c of seg.completionConditions) {
        if (c.type !== 'placeholder-clear-area') continue;
        const m = seg.markers.find((mk) => mk.id === c.areaId);
        if (!m) continue;
        const r = m.radius ?? 4;
        const dx = probe.playerPos.x - m.position[0];
        const dz = probe.playerPos.z - m.position[2];
        if (dx * dx + dz * dz <= r * r) useAdvancedMissionZoneStore.getState().recordAreaCleared(c.areaId);
      }

      const evalResult = evaluateSegmentCompletion(seg, probe);
      const store = useAdvancedMissionZoneStore.getState();
      for (const [cid, p] of Object.entries(evalResult.progress)) store.setConditionProgress(cid, p);
      if (evalResult.complete) {
        toastT.current = 0;
        completeCurrentSegment();
      }
      return;
    }

    if (phase === 'ZONE_COMPLETE') {
      toastT.current += dt;
      if (toastT.current >= ZONE_COMPLETE_TOAST_SEC) {
        toastT.current = 0;
        transitionToNextSegment();
      }
      return;
    }
  });

  return null;
};

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../stores/game/useGameStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { getEditorZoneSegment } from '../../stores/game/editorZoneSegmentStore';
import { spawnGroup, isGroupCleared } from '../combat/enemySpawnDirector';
import { liveTargets } from '../../stores/game/combatTargetStore';
import { robotHandle } from '../destination/robotHandle';
import type { ZoneSegmentDefinition } from '../../types/game/advancedMissionZone';
import { defenseProgress, shouldSpawnNextWave, timedRescueState, scanProgress, escortProgress, holdZoneState, surviveState, hackProgress } from './missionObjectiveControllers';

// Batch O — drives the mission-type objectives (defense-waves / timed-rescue / scan-targets) each frame and
// writes completion + live progress into the zone store (read by the evaluator + MissionObjectiveHud). Pure
// decisions live in missionObjectiveControllers; this is the side-effecting pump (spawn waves / proximity /
// scan count). Mounted in DestinationScene under ZONE_PHASES, like AdvancedMissionZoneDirectorHost.

interface MState {
  defense?: { spawnedIdx: number; lastSpawnAtS: number };
  rescue?: { startAtS: number; rescued: Set<string> };
  scan?: { spawned: boolean; counted: Set<string> };
  // Wave 3 — escort / hold-zone / survive-timer / hack-terminals.
  escort?: { pickedUp: boolean };
  hold?: { heldS: number };
  survive?: { startAtS: number };
  hack?: { perTerminalS: Record<string, number>; hacked: Set<string> };
}

const dist2 = (ax: number, az: number, bx: number, bz: number) => (ax - bx) ** 2 + (az - bz) ** 2;

const nowS = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

function originFor(seg: ZoneSegmentDefinition): { x: number; z: number } {
  const m = seg.markers.find((mk) => mk.type === 'objective') ?? seg.markers[0];
  return m ? { x: m.position[0], z: m.position[2] } : { x: robotHandle.pos.x, z: robotHandle.pos.z };
}

export const MissionObjectiveHost = () => {
  const stateBySeg = useRef<Record<string, Record<string, MState>>>({});
  const loaded = useRef<string | null>(null);

  useFrame((_, dtRaw) => {
    const dt = Math.min(0.05, dtRaw);
    if (useGameStore.getState().phase !== 'ZONE_SEGMENT_GAMEPLAY') return;
    const z = useAdvancedMissionZoneStore.getState();
    const segId = z.activeSegmentId ?? null;
    if (segId !== loaded.current) { loaded.current = segId; if (segId) stateBySeg.current[segId] = {}; }
    if (!segId) return;
    const seg = getEditorZoneSegment(segId);
    if (!seg) return;
    const local = (stateBySeg.current[segId] ??= {});
    const t = nowS();
    const origin = originFor(seg);

    for (const c of seg.completionConditions) {
      if (c.type === 'defense-waves') {
        const st = (local[c.id] ??= { defense: { spawnedIdx: 0, lastSpawnAtS: 0 } }).defense!;
        const groups = c.waveGroupIds;
        const priorCleared = st.spawnedIdx === 0 || groups.slice(0, st.spawnedIdx).every((g) => isGroupCleared(g));
        if (shouldSpawnNextWave(st.spawnedIdx, groups.length, priorCleared, t - st.lastSpawnAtS, c.waveIntervalSeconds)) {
          spawnGroup(groups[st.spawnedIdx], origin.x, origin.z);
          st.spawnedIdx += 1;
          st.lastSpawnAtS = t;
        }
        const allCleared = groups.slice(0, st.spawnedIdx).every((g) => isGroupCleared(g));
        const p = defenseProgress(st.spawnedIdx, groups.length, allCleared);
        z.setMissionObjectiveProgress(c.id, { current: p.current, total: p.total, label: p.label });
        if (p.done) z.recordMissionObjectiveComplete(c.id);
      } else if (c.type === 'timed-rescue') {
        const st = (local[c.id] ??= { rescue: { startAtS: t, rescued: new Set() } }).rescue!;
        for (const mid of c.rescueMarkerIds) {
          if (st.rescued.has(mid)) continue;
          const m = seg.markers.find((mk) => mk.id === mid);
          if (!m) continue;
          const r = m.radius ?? 4;
          const dx = robotHandle.pos.x - m.position[0], dz = robotHandle.pos.z - m.position[2];
          if (dx * dx + dz * dz <= r * r) st.rescued.add(mid);
        }
        const rs = timedRescueState(st.rescued.size, c.rescueMarkerIds.length, t - st.startAtS, c.seconds);
        z.setMissionObjectiveProgress(c.id, { current: rs.current, total: rs.total, label: rs.label });
        if (rs.done) z.recordMissionObjectiveComplete(c.id);
        else if (rs.expired) { st.startAtS = t; st.rescued.clear(); z.resetMissionObjective(c.id); } // forgiving reset
      } else if (c.type === 'scan-targets') {
        const st = (local[c.id] ??= { scan: { spawned: false, counted: new Set() } }).scan!;
        if (!st.spawned) { spawnGroup(c.scanGroupId, origin.x, origin.z); st.spawned = true; }
        for (const tgt of liveTargets) {
          if (tgt.spawnGroupId === c.scanGroupId && tgt.scanned && !st.counted.has(tgt.id)) st.counted.add(tgt.id);
        }
        const p = scanProgress(st.counted.size, c.count);
        z.setMissionObjectiveProgress(c.id, { current: p.current, total: p.total, label: p.label });
        if (p.done) z.recordMissionObjectiveComplete(c.id);
      } else if (c.type === 'escort-npc') {
        // Pick the NPC up by standing near its marker, then deliver it to the destination (it follows you).
        const st = (local[c.id] ??= { escort: { pickedUp: false } }).escort!;
        const npc = seg.markers.find((mk) => mk.id === c.npcMarkerId);
        const dest = seg.markers.find((mk) => mk.id === c.destinationMarkerId);
        if (npc && dest) {
          const px = robotHandle.pos.x, pz = robotHandle.pos.z;
          if (!st.pickedUp && dist2(px, pz, npc.position[0], npc.position[2]) <= (npc.radius ?? 4) ** 2) st.pickedUp = true;
          const toDest = st.pickedUp
            ? Math.hypot(px - dest.position[0], pz - dest.position[2]) // NPC follows the player
            : Math.hypot(npc.position[0] - dest.position[0], npc.position[2] - dest.position[2]);
          const p = escortProgress(toDest, dest.radius ?? 4);
          z.setMissionObjectiveProgress(c.id, { current: p.current, total: p.total, label: p.label });
          if (p.done) z.recordMissionObjectiveComplete(c.id);
        }
      } else if (c.type === 'hold-zone') {
        const st = (local[c.id] ??= { hold: { heldS: 0 } }).hold!;
        const m = seg.markers.find((mk) => mk.id === c.markerId);
        const inZone = !!m && dist2(robotHandle.pos.x, robotHandle.pos.z, m.position[0], m.position[2]) <= (c.radius ?? m.radius ?? 5) ** 2;
        if (inZone) st.heldS += dt;
        const p = holdZoneState(st.heldS, c.seconds, inZone);
        z.setMissionObjectiveProgress(c.id, { current: p.current, total: p.total, label: p.label });
        if (p.done) z.recordMissionObjectiveComplete(c.id);
      } else if (c.type === 'survive-timer') {
        const st = (local[c.id] ??= { survive: { startAtS: t } }).survive!;
        const p = surviveState(t - st.startAtS, c.seconds);
        z.setMissionObjectiveProgress(c.id, { current: p.current, total: p.total, label: p.label });
        if (p.done) z.recordMissionObjectiveComplete(c.id);
      } else if (c.type === 'hack-terminals') {
        const st = (local[c.id] ??= { hack: { perTerminalS: {}, hacked: new Set() } }).hack!;
        for (const tid of c.terminalMarkerIds) {
          if (st.hacked.has(tid)) continue;
          const m = seg.markers.find((mk) => mk.id === tid);
          if (!m) continue;
          const inRange = dist2(robotHandle.pos.x, robotHandle.pos.z, m.position[0], m.position[2]) <= (c.radius ?? m.radius ?? 4) ** 2;
          if (inRange) { st.perTerminalS[tid] = (st.perTerminalS[tid] ?? 0) + dt; if (st.perTerminalS[tid] >= c.secondsPerTerminal) st.hacked.add(tid); }
        }
        const p = hackProgress(st.hacked.size, c.terminalMarkerIds.length);
        z.setMissionObjectiveProgress(c.id, { current: p.current, total: p.total, label: p.label });
        if (p.done) z.recordMissionObjectiveComplete(c.id);
      }
    }
  });

  return null;
};

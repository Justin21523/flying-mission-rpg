// Batch O — PURE progress/decision helpers for the mission-type objectives (defense-waves / timed-rescue /
// scan-targets) so the loop is unit-testable. MissionObjectiveHost wires these to spawn/proximity/scan side
// effects + writes the results into useAdvancedMissionZoneStore.

export interface ObjectiveProgress { current: number; total: number; done: boolean; label?: string }

// Defense waves: spawn groups sequentially; done when all groups have been spawned AND cleared.
export function defenseProgress(spawnedCount: number, totalGroups: number, allSpawnedCleared: boolean): ObjectiveProgress {
  const spawnedAll = spawnedCount >= totalGroups && totalGroups > 0;
  const done = spawnedAll && allSpawnedCleared;
  const cur = done ? totalGroups : Math.min(spawnedCount, totalGroups);
  return { current: cur, total: Math.max(1, totalGroups), done, label: `Wave ${cur}/${Math.max(1, totalGroups)}` };
}

// Whether to spawn the next wave: when the prior waves are cleared, or the spawn interval has elapsed.
export function shouldSpawnNextWave(spawnedCount: number, totalGroups: number, priorCleared: boolean, secondsSinceLastSpawn: number, intervalSeconds: number): boolean {
  if (spawnedCount >= totalGroups) return false;
  if (spawnedCount === 0) return true; // first wave immediately
  return priorCleared || secondsSinceLastSpawn >= intervalSeconds;
}

// Timed rescue: countdown; done when all markers reached in time; expired (→ forgiving reset) otherwise.
export function timedRescueState(rescuedCount: number, totalMarkers: number, elapsedSeconds: number, seconds: number): ObjectiveProgress & { expired: boolean } {
  const done = totalMarkers > 0 && rescuedCount >= totalMarkers;
  const expired = !done && elapsedSeconds >= seconds;
  const left = Math.max(0, Math.ceil(seconds - elapsedSeconds));
  return { current: rescuedCount, total: Math.max(1, totalMarkers), done, expired, label: `Rescued ${rescuedCount}/${Math.max(1, totalMarkers)} · ${left}s` };
}

// Scan targets: done when `count` targets have been scanned.
export function scanProgress(scannedCount: number, count: number): ObjectiveProgress {
  const done = scannedCount >= count && count > 0;
  return { current: Math.min(scannedCount, count), total: Math.max(1, count), done, label: `Scanned ${Math.min(scannedCount, count)}/${Math.max(1, count)}` };
}

// Wave 3 — escort: the NPC marker advances toward its destination while the player stays near it; done when
// the NPC reaches the destination (within arriveRadius).
export function escortProgress(npcToDestDist: number, arriveRadius: number): ObjectiveProgress {
  const done = npcToDestDist <= arriveRadius;
  return { current: done ? 1 : 0, total: 1, done, label: done ? 'Escort complete' : `Escort · ${Math.ceil(npcToDestDist)}m to go` };
}

// Wave 3 — hold zone: accrue seconds while the player stands in the marker (resets if they leave); done at target.
export function holdZoneState(heldSeconds: number, targetSeconds: number, inZone: boolean): ObjectiveProgress {
  const done = heldSeconds >= targetSeconds && targetSeconds > 0;
  const cur = Math.min(Math.floor(heldSeconds), targetSeconds);
  return { current: cur, total: Math.max(1, targetSeconds), done, label: inZone ? `Holding ${cur}/${targetSeconds}s` : `Hold the point — ${cur}/${targetSeconds}s` };
}

// Wave 3 — survive timer: done when the player has survived the full duration.
export function surviveState(elapsedSeconds: number, seconds: number): ObjectiveProgress {
  const done = elapsedSeconds >= seconds && seconds > 0;
  const left = Math.max(0, Math.ceil(seconds - elapsedSeconds));
  return { current: Math.min(Math.floor(elapsedSeconds), seconds), total: Math.max(1, seconds), done, label: done ? 'Survived!' : `Survive · ${left}s` };
}

// Wave 3 — hack terminals: each terminal needs secondsPerTerminal of presence; done when all are hacked.
export function hackProgress(hackedCount: number, totalTerminals: number): ObjectiveProgress {
  const done = hackedCount >= totalTerminals && totalTerminals > 0;
  return { current: Math.min(hackedCount, totalTerminals), total: Math.max(1, totalTerminals), done, label: `Hacked ${Math.min(hackedCount, totalTerminals)}/${Math.max(1, totalTerminals)}` };
}

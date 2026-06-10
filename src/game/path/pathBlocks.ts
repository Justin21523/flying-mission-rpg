// Phase F — a neutral module the follower AI consults so the Traffic Incident Director can make followers
// slow / stop / reroute around staged scenarios WITHOUT the AI importing the incident system (one-way data
// flow: the scenario runtime writes here; pathFollowerAI reads here). Plain module sets/arrays — no React.
const blockedPaths = new Set<string>();

interface Blocker { key: string; areaId: string; x: number; z: number }
const blockers: Blocker[] = [];

export function setPathBlocked(pathId: string, blocked: boolean): void {
  if (blocked) blockedPaths.add(pathId); else blockedPaths.delete(pathId);
}
export function isPathBlocked(pathId: string): boolean { return blockedPaths.has(pathId); }

export function addBlocker(key: string, areaId: string, x: number, z: number): void {
  const i = blockers.findIndex((b) => b.key === key);
  if (i >= 0) { blockers[i].areaId = areaId; blockers[i].x = x; blockers[i].z = z; }
  else blockers.push({ key, areaId, x, z });
}
export function removeBlocker(key: string): void {
  const i = blockers.findIndex((b) => b.key === key);
  if (i >= 0) blockers.splice(i, 1);
}
export function forEachBlocker(areaId: string, cb: (x: number, z: number) => void): void {
  for (const b of blockers) if (b.areaId === areaId) cb(b.x, b.z);
}

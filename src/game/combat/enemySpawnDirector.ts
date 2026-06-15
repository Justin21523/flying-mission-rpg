import { liveTargets } from '../../stores/game/combatTargetStore';
import { getEnemyDef, getSpawnGroup, getSpawnGroupsForSegment } from '../../stores/game/editorCombatStore';
import { spawnEnemyFromDef } from './enemyRuntime';

// Segment-linked enemy encounters (Batch C). Spawns an EnemySpawnGroup's enemies (tagged with the group id)
// and tracks whether the group is cleared (all spawned enemies defeated). The zone probe reads
// clearedGroupIds() to satisfy `defeat-enemy-group` conditions. No store-bypass — enemies go through
// spawnEnemyFromDef → combatTargetStore.

const spawnedByGroup: Record<string, string[]> = {}; // groupId → spawned target ids
const activeGroups = new Set<string>();

function formationOffset(formation: string | undefined, i: number, count: number): { dx: number; dz: number } {
  if (count <= 1) return { dx: 0, dz: 0 };
  if (formation === 'circle') { const a = (i / count) * Math.PI * 2; return { dx: Math.cos(a) * 4, dz: Math.sin(a) * 4 }; }
  if (formation === 'line') return { dx: (i - (count - 1) / 2) * 3, dz: 0 };
  return { dx: (Math.random() - 0.5) * 5, dz: (Math.random() - 0.5) * 5 }; // cluster
}

export function spawnGroup(groupId: string, originX: number, originZ: number): boolean {
  const group = getSpawnGroup(groupId);
  if (!group || group.enabled === false || activeGroups.has(groupId)) return false;
  const ids: string[] = [];
  for (const entry of group.enemies) {
    const def = getEnemyDef(entry.enemyDefinitionId);
    if (!def) continue;
    for (let i = 0; i < entry.count; i++) {
      const off = formationOffset(entry.formation, i, entry.count);
      const t = spawnEnemyFromDef(def, originX + off.dx, originZ + off.dz);
      t.spawnGroupId = groupId;
      ids.push(t.id);
    }
  }
  spawnedByGroup[groupId] = ids;
  activeGroups.add(groupId);
  return ids.length > 0;
}

export function spawnGroupsForSegment(segmentId: string, originX: number, originZ: number): void {
  for (const g of getSpawnGroupsForSegment(segmentId)) {
    if (g.spawnMode === 'on-segment-enter') spawnGroup(g.id, originX, originZ);
  }
}

export function despawnGroup(groupId: string): void {
  const ids = spawnedByGroup[groupId];
  if (ids) for (const id of ids) { const i = liveTargets.findIndex((t) => t.id === id); if (i >= 0) liveTargets.splice(i, 1); }
  delete spawnedByGroup[groupId];
  activeGroups.delete(groupId);
}

// A group is cleared once it was spawned and every spawned enemy is defeated or removed.
export function isGroupCleared(groupId: string): boolean {
  const ids = spawnedByGroup[groupId];
  if (!ids || ids.length === 0) return false;
  return ids.every((id) => { const t = liveTargets.find((x) => x.id === id); return !t || t.defeatedAt > 0; });
}

export function groupRemaining(groupId: string): { remaining: number; total: number } {
  const ids = spawnedByGroup[groupId] ?? [];
  const remaining = ids.filter((id) => { const t = liveTargets.find((x) => x.id === id); return t && t.defeatedAt === 0; }).length;
  return { remaining, total: ids.length };
}

export function clearedGroupIds(): Set<string> {
  const s = new Set<string>();
  for (const id of activeGroups) if (isGroupCleared(id)) s.add(id);
  return s;
}

export function resetSpawnDirector(): void {
  for (const k of Object.keys(spawnedByGroup)) delete spawnedByGroup[k];
  activeGroups.clear();
}

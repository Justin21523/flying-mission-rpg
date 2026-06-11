import type { WorldLocation } from '../../types/game/world';
import type { Region } from '../../types/game/region';
import type { DialogueCondition } from '../../types/dialogue';
import { evaluateCondition } from '../evaluateCondition';
import { missionRequirementConditions } from '../missions/missionChain';

// Pure map-system helpers. isLocationUnlocked stays testable via an injectable `evalFn` (default = the live
// condition engine), mirroring isMissionAvailable.

type UnlockGate = Pick<WorldLocation, 'unlocked' | 'requiredMissionIds' | 'unlockConditions'>;
type RegionGate = Pick<Region, 'unlocked' | 'requiredMissionIds' | 'unlockConditions'>;

// A location is locked by a manual `unlocked: false` (hard override) on it or its region; otherwise it unlocks
// once ALL its + its region's progress conditions pass (required missions → done-flags, plus unlockConditions).
export function isLocationUnlocked(
  loc: UnlockGate,
  region: RegionGate | undefined,
  evalFn: (c: DialogueCondition) => boolean = evaluateCondition,
): boolean {
  if (loc.unlocked === false) return false;
  if (region?.unlocked === false) return false;
  const conds: DialogueCondition[] = [
    ...(loc.unlockConditions ?? []),
    ...missionRequirementConditions(loc.requiredMissionIds),
    ...(region?.unlockConditions ?? []),
    ...missionRequirementConditions(region?.requiredMissionIds),
  ];
  return conds.every(evalFn);
}

export interface RegionGroup {
  region: Region | null; // null = the "Unassigned" bucket
  locations: WorldLocation[];
}

// Group locations by region, regions ordered by `order` (then name); each region's locations ordered by
// `order` (then name). An "Unassigned" bucket (region null) holds locations with no/unknown region and is last.
export function locationsByRegion(locations: readonly WorldLocation[], regions: readonly Region[]): RegionGroup[] {
  const byId = new Map(regions.map((r) => [r.id, r]));
  const sortedRegions = [...regions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
  const locSort = (a: WorldLocation, b: WorldLocation) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name);
  const groups: RegionGroup[] = sortedRegions.map((region) => ({
    region,
    locations: locations.filter((l) => l.regionId === region.id).sort(locSort),
  }));
  const unassigned = locations.filter((l) => !l.regionId || !byId.has(l.regionId)).sort(locSort);
  if (unassigned.length) groups.push({ region: null, locations: unassigned });
  return groups;
}

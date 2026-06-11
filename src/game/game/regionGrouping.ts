import type { WorldLocation } from '../../types/game/world';
import type { Region } from '../../types/game/region';

// Pure map-system helpers (no React/stores → unit-testable).

// A location is available unless it or its region is explicitly locked (default = unlocked).
export function isLocationUnlocked(loc: Pick<WorldLocation, 'unlocked'>, region: Pick<Region, 'unlocked'> | undefined): boolean {
  if (loc.unlocked === false) return false;
  if (region && region.unlocked === false) return false;
  return true;
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

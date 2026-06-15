import type { HitVolumeDefinition } from '../../types/game/combat';

// Pure geometric hit detection. Reuses the facing-cone / AoE-radius math from yokaiCombatStore.damage but
// generalised to the HitVolumeDefinition shapes. Operates on a plain list of {id, position} — targets come
// from the combat target registry, not this module. Structured so a Rapier/BVH backend can replace the
// `overlaps` math later without changing callers.

export interface HitTargetPoint {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface HitVolumeWorld {
  // Caster origin + forward (unit) direction in world space.
  originX: number; originZ: number;
  dirX: number; dirZ: number;
}

function overlaps(def: HitVolumeDefinition, world: HitVolumeWorld, t: HitTargetPoint): boolean {
  const ox = world.originX + (def.offset?.[0] ?? 0);
  const oz = world.originZ + (def.offset?.[2] ?? 0);
  const dx = t.x - ox;
  const dz = t.z - oz;

  switch (def.shape) {
    case 'sphere':
    case 'cylinder':
    case 'capsule':
    case 'ring': {
      const r = def.radius ?? 5;
      return dx * dx + dz * dz <= r * r;
    }
    case 'box': {
      const halfL = (def.length ?? 4) / 2;
      const halfW = (def.width ?? 4) / 2;
      // Box oriented to facing: project onto forward (length) + perpendicular (width).
      const along = dx * world.dirX + dz * world.dirZ;
      const perp = Math.abs(dx * world.dirZ - dz * world.dirX);
      return Math.abs(along) <= halfL && perp <= halfW;
    }
    case 'line': {
      const len = def.length ?? 12;
      const halfW = (def.width ?? 1) / 2;
      const along = dx * world.dirX + dz * world.dirZ;       // forward projection
      const perp = Math.abs(dx * world.dirZ - dz * world.dirX); // perpendicular distance
      return along > -0.5 && along < len && perp < halfW;
    }
    case 'cone':
    case 'arc': {
      const reach = def.radius ?? def.length ?? 4;
      const dist = Math.hypot(dx, dz);
      if (dist > reach || dist < 0.001) return dist < 0.001; // at origin = hit
      const along = (dx * world.dirX + dz * world.dirZ) / dist; // cos angle to facing
      const halfAngle = ((def.angleDegrees ?? 90) / 2) * (Math.PI / 180);
      return along >= Math.cos(halfAngle);
    }
    default:
      // spline-placeholder etc. — fall back to a radius check so it still functions.
      return dx * dx + dz * dz <= (def.radius ?? 4) ** 2;
  }
}

// Return the ids of all targets overlapping the hit volume.
export function queryHits(def: HitVolumeDefinition, world: HitVolumeWorld, targets: HitTargetPoint[]): string[] {
  const hits: string[] = [];
  for (const t of targets) {
    if (overlaps(def, world, t)) hits.push(t.id);
  }
  return hits;
}

// Total active window of a hit volume (delay + duration) in seconds — used to expire runtime volumes.
export function hitVolumeActiveWindow(def: HitVolumeDefinition): number {
  return (def.activeDelaySeconds ?? 0) + def.activeDurationSeconds;
}

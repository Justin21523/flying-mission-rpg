import type { Vec2 } from './CompanionNavigationAgent';

export interface AvoidZone {
  x: number;
  z: number;
  radius: number;
}

export function separationOffset(current: Vec2, others: readonly Vec2[], radius: number): Vec2 {
  let x = 0;
  let z = 0;
  for (const other of others) {
    const dx = current.x - other.x;
    const dz = current.z - other.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.001 && d < radius) {
      const push = (radius - d) / radius;
      x += (dx / d) * push;
      z += (dz / d) * push;
    }
  }
  return { x, z };
}

export function zoneAvoidanceOffset(current: Vec2, zones: readonly AvoidZone[]): Vec2 {
  let x = 0;
  let z = 0;
  for (const zone of zones) {
    const dx = current.x - zone.x;
    const dz = current.z - zone.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.001 && d < zone.radius) {
      const push = (zone.radius - d) / zone.radius;
      x += (dx / d) * push;
      z += (dz / d) * push;
    }
  }
  return { x, z };
}

export function applySeparation(current: Vec2, others: readonly Vec2[], radius: number, strength = 1): Vec2 {
  const off = separationOffset(current, others, radius);
  return { x: current.x + off.x * strength, z: current.z + off.z * strength };
}

export function applyAvoidance(current: Vec2, others: readonly Vec2[], zones: readonly AvoidZone[], radius: number, strength = 1): Vec2 {
  const sep = separationOffset(current, others, radius);
  const zone = zoneAvoidanceOffset(current, zones);
  return { x: current.x + (sep.x + zone.x) * strength, z: current.z + (sep.z + zone.z) * strength };
}

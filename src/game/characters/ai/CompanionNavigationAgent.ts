export interface Vec2 {
  x: number;
  z: number;
}

export function moveToward2D(current: Vec2, target: Vec2, speed: number, dt: number): Vec2 {
  const dx = target.x - current.x;
  const dz = target.z - current.z;
  const dist = Math.hypot(dx, dz);
  if (dist <= 0.001) return current;
  const step = Math.min(dist, Math.max(0, speed * dt));
  return { x: current.x + (dx / dist) * step, z: current.z + (dz / dist) * step };
}

export function followSlot(target: Vec2, index: number, distance: number): Vec2 {
  const angle = index * 2.399963229728653;
  return { x: target.x + Math.cos(angle) * distance, z: target.z + Math.sin(angle) * distance };
}

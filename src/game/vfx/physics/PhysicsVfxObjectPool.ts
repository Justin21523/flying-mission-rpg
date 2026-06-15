// Pool cap for physics VFX objects (Batch F.6). Bounds the total live kinematic objects so ability spam can't
// flood the scene; acquire(n) reserves a batch, release(n) frees it.
const MAX_PHYSICS_VFX_OBJECTS = 200;
let active = 0;

export function poolCapacity(): number {
  return MAX_PHYSICS_VFX_OBJECTS;
}
export function activeCount(): number {
  return active;
}
export function canAcquire(n = 1): boolean {
  return active + n <= MAX_PHYSICS_VFX_OBJECTS;
}
export function acquire(n = 1): boolean {
  if (active + n > MAX_PHYSICS_VFX_OBJECTS) return false;
  active += n;
  return true;
}
export function release(n = 1): void {
  active = Math.max(0, active - n);
}
export function resetPool(): void {
  active = 0;
}

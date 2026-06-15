// Cinematic effect instance pool / cap (Batch F.5). The heavy mesh/particle pooling lives in the reused V2
// renderers (THREE.Points buffers, GLB clone pools); this guards the NUMBER of concurrent combat effect
// instances so a spam of casts can't unbound the active set. Acquire returns false when at capacity.

const MAX_ACTIVE_COMBAT_EFFECTS = 64;
let active = 0;

export function poolCapacity(): number {
  return MAX_ACTIVE_COMBAT_EFFECTS;
}
export function activeCount(): number {
  return active;
}
export function canAcquire(): boolean {
  return active < MAX_ACTIVE_COMBAT_EFFECTS;
}
export function acquire(): boolean {
  if (active >= MAX_ACTIVE_COMBAT_EFFECTS) return false;
  active += 1;
  return true;
}
export function release(): void {
  active = Math.max(0, active - 1);
}
export function resetPool(): void {
  active = 0;
}

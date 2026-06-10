// Pure XZ distance check used by LiftPlatform for platform proximity/alignment (extracted so it's
// unit-testable, away from the R3F frame loop).
export function withinRadius(px: number, pz: number, cx: number, cz: number, r: number): boolean {
  return Math.hypot(px - cx, pz - cz) <= r;
}

// Clamp a numeric editor value to its declared range — only when a bound is given (so unbounded fields pass
// through). NaN falls back to the min (or 0). Used by the editor NumRow inputs so typed values can't escape
// their min/max (route u/startU/endU, fov, scales, counts…) and pollute authored data.
export function clampNum(v: number, min?: number, max?: number): number {
  let n = Number.isNaN(v) ? (min ?? 0) : v;
  if (min !== undefined && n < min) n = min;
  if (max !== undefined && n > max) n = max;
  return n;
}

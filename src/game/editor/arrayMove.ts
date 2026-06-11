// Move an item up (-1) or down (+1) in an ordered list — immutable, clamped (no-op at the ends). Used by the
// time-ordered editors (transformation stages / camera shots / effect tracks, animation rules, route segments)
// where order matters.
export function moveItem<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const j = index + dir;
  if (index < 0 || index >= arr.length || j < 0 || j >= arr.length) return arr;
  const next = arr.slice();
  const tmp = next[index];
  next[index] = next[j];
  next[j] = tmp;
  return next;
}

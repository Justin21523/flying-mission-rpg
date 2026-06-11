import type { SuperMove } from '../../types/character';

// Map a Digit1–Digit6 key code to the character's super move on that slot (null if out of range / unbound).
// Pure → unit-testable; the destination controller uses it on keydown.
export function superForKey(supers: readonly SuperMove[] | undefined, code: string): SuperMove | null {
  const m = /^Digit([1-6])$/.exec(code);
  if (!m) return null;
  return supers?.[parseInt(m[1], 10) - 1] ?? null;
}

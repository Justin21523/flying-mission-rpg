// Deterministic seeded PRNG (mulberry32) — same seed → same sequence. Pure + unit-testable; used by the
// rule-based mission generator so a fixed seed reproduces the same missions. No global Math.random.
export interface Rng {
  next(): number; // [0, 1)
  int(n: number): number; // [0, n)
  range(lo: number, hi: number): number; // inclusive integer [lo, hi]
  pick<T>(arr: readonly T[]): T;
  weighted<T>(items: readonly T[], weights: readonly number[]): T;
  chance(p: number): boolean;
  shuffle<T>(arr: readonly T[]): T[];
}

// FNV-1a hash → uint32 so string seeds ("daily-2026-06-12") and numbers both work.
export function hashSeed(seed: string | number): number {
  if (typeof seed === 'number') return seed >>> 0;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: string | number): Rng {
  let a = hashSeed(seed) || 1;
  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (n: number): number => Math.floor(next() * Math.max(1, Math.floor(n)));
  return {
    next,
    int,
    range: (lo, hi) => lo + int(hi - lo + 1),
    pick: (arr) => arr[int(arr.length)],
    weighted: (items, weights) => {
      const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
      if (total <= 0) return items[int(items.length)];
      let r = next() * total;
      for (let i = 0; i < items.length; i += 1) {
        r -= Math.max(0, weights[i]);
        if (r < 0) return items[i];
      }
      return items[items.length - 1];
    },
    chance: (p) => next() < p,
    shuffle: (arr) => {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i -= 1) {
        const j = int(i + 1);
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}

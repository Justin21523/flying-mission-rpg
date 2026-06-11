import type { PathDefinition } from '../../types/path';

// Pure per-node flight parameter sampling (no R3F → testable). Given progress u (0..1) along a path, return
// the nearest node's authored speed multiplier + bank bias so the flight followers can honour per-node
// authoring GENTLY (neutral defaults → today's flight feel is unchanged; flight feel is a core pillar).
export interface NodeParams {
  speedMul: number; // local speed scale (default 1)
  bankDeg: number; // extra roll bias in degrees (default 0)
}

export function sampleNodeParams(path: PathDefinition | undefined, u: number): NodeParams {
  const nodes = path?.nodes ?? [];
  if (nodes.length === 0) return { speedMul: 1, bankDeg: 0 };
  const clamped = u < 0 ? 0 : u > 1 ? 1 : u;
  // Uniform-by-index mapping (matches the curve's even node spacing closely enough for a gentle modifier).
  const idx = Math.round(clamped * (nodes.length - 1));
  const n = nodes[Math.max(0, Math.min(nodes.length - 1, idx))];
  return { speedMul: n.speedMultiplier ?? 1, bankDeg: n.bankDeg ?? 0 };
}

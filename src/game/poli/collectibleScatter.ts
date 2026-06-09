import { getEffectiveAreaSize } from '../world/areaExtent';

// POLI — deterministic scatter for collectibles, seeded by area id + collectible type id so each type lays out
// independently and stably (respawns identically on area re-entry). Kept separate so the layer file stays
// component-only (react-refresh).
const rand = (n: number): number => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function seedOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function computeCollectiblePositions(areaId: string, typeId: string, count: number): [number, number, number][] {
  const lim = Math.max(4, getEffectiveAreaSize(areaId) - 4);
  const h = seedOf(`${areaId}:${typeId}`);
  const out: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const x = (rand(h + i * 2 + 1) - 0.5) * 2 * lim;
    const z = (rand(h + i * 2 + 2) - 0.5) * 2 * lim;
    out.push([Math.round(x * 10) / 10, 0, Math.round(z * 10) / 10]);
  }
  return out;
}

// Airborne scatter — same area spread but a random HEIGHT in [minH, maxH], so collectibles fill the sky too.
// Separate seed so air items don't sit directly over the ground ones.
export function computeCollectibleAirPositions(areaId: string, typeId: string, count: number, minH: number, maxH: number): [number, number, number][] {
  const lim = Math.max(4, getEffectiveAreaSize(areaId) - 4);
  const h = seedOf(`${areaId}:${typeId}:air`);
  const lo = Math.min(minH, maxH), hi = Math.max(minH, maxH);
  const out: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const x = (rand(h + i * 3 + 1) - 0.5) * 2 * lim;
    const z = (rand(h + i * 3 + 2) - 0.5) * 2 * lim;
    const y = lo + rand(h + i * 3 + 3) * (hi - lo);
    out.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10, Math.round(z * 10) / 10]);
  }
  return out;
}

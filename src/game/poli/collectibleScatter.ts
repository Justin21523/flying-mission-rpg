import { getEffectiveAreaSize } from '../world/areaExtent';

// POLI — deterministic scatter for collectibles, seeded by area id + collectible type id so each type lays out
// independently and stably (respawns identically on area re-entry). Kept separate so the layer file stays
// component-only (react-refresh).
const rand = (n: number): number => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function computeCollectiblePositions(areaId: string, typeId: string, count: number): [number, number, number][] {
  const lim = Math.max(4, getEffectiveAreaSize(areaId) - 4);
  let h = 0;
  const seed = `${areaId}:${typeId}`;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const x = (rand(h + i * 2 + 1) - 0.5) * 2 * lim;
    const z = (rand(h + i * 2 + 2) - 0.5) * 2 * lim;
    out.push([Math.round(x * 10) / 10, 0, Math.round(z * 10) / 10]);
  }
  return out;
}

import { getAreaSize } from '../../stores/editorWorldStore';

// POLI — deterministic pickup scatter for an area (shared by PickupLayer + the radar HUD). Kept in its own
// module so the component files stay component-only (react-refresh).
const rand = (n: number): number => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function computePickupPositions(areaId: string, count: number, spread: number): [number, number, number][] {
  const lim = Math.min(spread, getAreaSize(areaId) - 4);
  let h = 0;
  for (let i = 0; i < areaId.length; i++) h = (h * 31 + areaId.charCodeAt(i)) >>> 0;
  const out: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const x = (rand(h + i * 2 + 1) - 0.5) * 2 * lim;
    const z = (rand(h + i * 2 + 2) - 0.5) * 2 * lim;
    out.push([Math.round(x), 0, Math.round(z)]);
  }
  return out;
}

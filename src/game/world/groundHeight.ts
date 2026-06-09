import { resolveAreaEnvironment } from '../environment/resolveAreaEnvironment';
import { sampleHeight, type SculptGrid } from './heightfieldTerrain';
import { decodeFloat32 } from './terrainCodec';

// POLI — synchronous terrain ground height at world (x,z) for an area, used to keep travel spawns ON TOP of
// sculpted terrain. Heightfield areas can be sculpted arbitrarily high, so a fixed spawn Y can end up UNDER
// the ground; this samples the same noise + committed sculpt the collider is built from so we can lift the
// spawn above it. Flat-ground / indoor areas are ~0. (Async heightmap images can't be sampled here — we add
// their amplitude as worst-case headroom so we still never spawn beneath them.)
const SCULPT_RES = 129;

export function groundHeightAt(areaId: string, x: number, z: number): number {
  const env = resolveAreaEnvironment(areaId);
  if (env.groundType !== 'heightfield') return 0;
  const cfg = env.terrain;
  const sc = cfg.sculpt;
  const res = sc?.res ?? SCULPT_RES;
  const grid: SculptGrid | null = sc?.data ? { res, data: decodeFloat32(sc.data, res * res) } : null;
  let h = sampleHeight(x, z, cfg, null, grid);
  if (cfg.heightmapAmplitude) h += cfg.heightmapAmplitude; // image is async → reserve headroom
  return h;
}

// A safe spawn Y at (x,z): never below the requested Y, and always a margin ABOVE the ground so the player
// drops onto the surface instead of being placed inside/under sculpted terrain. The body origin is at the feet.
const SPAWN_LIFT = 2;
export function safeSpawnY(areaId: string, x: number, z: number, requestedY: number): number {
  return Math.max(requestedY, groundHeightAt(areaId, x, z) + SPAWN_LIFT);
}

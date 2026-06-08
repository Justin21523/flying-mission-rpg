import { useEditorLayoutStore } from '../../stores/editorLayoutStore';
import type { Vec3 } from '../../stores/editorLayoutStore';

// POLI — auto-populate a playable STARTER WORLD: one default layout preset per area, filled with a tasteful
// set of the user's GLB models + a paved (PBR-textured) ground. Idempotent (per-area + a version flag), so
// it never fights edits. Everything seeded is gizmo-editable in Edit Mode and swappable in the 🗺 World tab.
// Models render at their authored scale (no auto-normalisation) — positions are spread out; fine-tune freely.

const SEED_FLAG = 'r3f-rpg-builder-poli-world-content-seed-v1';

interface SeedPiece { assetId: string; pos: Vec3; }
interface AreaSeed { areaId: string; ground?: string; groundRepeat?: number; pieces: SeedPiece[]; }

// Ground keys are texture-library albedo keys (matched against TEXTURE_SETS.albedoKey).
const G = {
  cobble: 'cobblestone_pavement_diff_4k',
  asphalt: 'asphalt_03_diff_4k',
  brick: 'herringbone_brick_03_diff_4k',
  sand: 'aerial_beach_01_diff_4k',
  concrete: 'concrete_tiles_diff_4k',
  gravel: 'gravel_diff_4k',
  leaves: 'forest_leaves_02_diffuse_4k',
};

const p = (assetId: string, x: number, z: number, y = 0): SeedPiece => ({ assetId, pos: [x, y, z] });

const WORLD_SEED: AreaSeed[] = [
  {
    areaId: 'rescue_hq', ground: G.cobble, groundRepeat: 20,
    pieces: [
      p('buildings/fire station 3d model', -9, -9),
      p('outerior_decors/cartoon repair bay 3d model', 9, -9),
      p('outerior_decors/rescue tool rack 3d model', 6, 5),
      p('characters/Jin 3d model', 0, -5),
      p('props/standing signpost 3d model', 0, 6),
    ],
  },
  {
    areaId: 'central_plaza', ground: G.cobble, groundRepeat: 20,
    pieces: [
      p('buildings/city brew cafe 3d model', -9, -7),
      p('buildings/public library 3d model', 9, -7),
      p('props/wooden bench 3d model', -3, 3),
      p('props/wooden bench 3d model', 3, 3),
      p('props/potted plant 3d model', 0, 0),
    ],
  },
  {
    areaId: 'school_district', ground: G.cobble, groundRepeat: 20,
    pieces: [
      p('buildings/stylized elementary school 3d model', 0, -11),
      p('buildings/cute bus stop 3d model', -9, 4),
      p('buildings/playground set 3d model', 9, 2),
      p('npcs/animated school bus 3d model', -5, 7),
      p('npcs/3d+cartoon+student+npc', 2, 5),
    ],
  },
  {
    areaId: 'main_road', ground: G.asphalt, groundRepeat: 30,
    pieces: [
      p('outerior_decors/cartoon city intersection 3d model', 0, 0),
      p('buildings/convenience store 3d model', -11, -7),
      p('buildings/bank building 3d model', 11, -7),
      p('buildings/city traffic light 3d model', 4, 5),
      p('outerior_decors/pedestrian crosswalk prop 3d model', 0, 7),
    ],
  },
  {
    areaId: 'commercial_mall', ground: G.asphalt, groundRepeat: 28,
    pieces: [
      p('buildings/mall building 3d model', 0, -11),
      p('buildings/supermarket storefront 3d model', -11, 0),
      p('buildings/toy shop building 3d model', 11, 0),
      p('props/vending machine 3d model', 4, 5),
    ],
  },
  {
    areaId: 'charging_station', ground: G.brick, groundRepeat: 24,
    pieces: [
      p('outerior_decors/cartoon charging station 3d model', 0, -6),
      p('outerior_decors/stylized charging post 3d model', -4, -2),
      p('outerior_decors/stylized charging post 3d model', 4, -2),
      p('outerior_decors/stylized charging car 3d model', 0, 3),
    ],
  },
  {
    areaId: 'residential_lane', ground: G.brick, groundRepeat: 24,
    pieces: [
      p('buildings/modern house 3d model', -9, -7),
      p('buildings/modern house 2 3d model', 0, -9),
      p('buildings/japanese house 3d model', 9, -7),
      p('buildings/apartment building 3d model', -11, 7),
      p('buildings/park entrance 3d model', 9, 7),
    ],
  },
  {
    areaId: 'harbor_front', ground: G.sand, groundRepeat: 26,
    pieces: [
      p('buildings/cartoon harbor entrance 3d model', 0, -11),
      p('buildings/harbor warehouse 3d model', -11, -4),
      p('outerior_decors/dock platform 3d model', 6, 4),
      p('outerior_decors/harbor crane toy 3d model', 11, -2),
      p('outerior_decors/mooring bollard 3d model', 3, 9),
      p('outerior_decors/stylized shipping containers 3d model', -6, 7),
    ],
  },
  {
    areaId: 'coast_beach', ground: G.sand, groundRepeat: 30,
    pieces: [
      p('buildings/beach hut 3d model', -6, -4),
      p('buildings/lighthouse 3d model', 11, -9),
      p('outerior_decors/coastal road 3d model', 0, 7),
      p('outerior_decors/safety buoy 3d model', 4, 4),
    ],
  },
  {
    areaId: 'construction_site', ground: G.concrete, groundRepeat: 22,
    pieces: [
      p('buildings/construction tower 3d model', 0, -11),
      p('outerior_decors/construction pit 3d model', -6, 2),
      p('outerior_decors/construction barrier 3d model', 4, 4),
      p('outerior_decors/construction sign 3d model', -2, 7),
      p('npcs/cement mixer truck 3d model', 9, 2),
    ],
  },
  {
    areaId: 'industrial_yard', ground: G.gravel, groundRepeat: 26,
    pieces: [
      p('buildings/industrial warehouse 3d model', -11, -7),
      p('buildings/industrial facility 3d model', 11, -7),
      p('props/shipping container 3d model', 0, 4),
      p('props/stacked cardboard boxes 3d model', 4, 7),
      p('npcs/bulldozer toy 3d model', -4, 7),
    ],
  },
  {
    areaId: 'forest_edge', ground: G.leaves, groundRepeat: 18,
    pieces: [
      p('scenes/forest path 3d model', 0, 0),
      p('outerior_decors/stylized trees 3d model', -8, -7),
      p('outerior_decors/stylized trees 3d model', 8, -7),
      p('scenes/forest pond 3d model', 6, 7),
      p('outerior_decors/stylized forest trees 3d model', -8, 7),
    ],
  },
  {
    areaId: 'desert_outpost', ground: G.sand, groundRepeat: 30,
    pieces: [
      p('buildings/desert supply station 3d model', -6, -6),
      p('buildings/desert rescue base 3d model', 9, -6),
      p('outerior_decors/radar dish 3d model', 6, 4),
      p('props/standing signpost 3d model', 0, 5),
    ],
  },
];

// Idempotent: seed one "Default" layout preset per area (skip areas that already have presets, so user
// edits and re-runs are safe). Guarded by a version flag for cheap no-op on later boots.
export function seedWorld(): void {
  try {
    if (localStorage.getItem(SEED_FLAG)) return;
  } catch { /* ignore */ }

  const store = useEditorLayoutStore.getState();
  for (const area of WORLD_SEED) {
    if ((store.presets[area.areaId]?.length ?? 0) > 0) continue; // don't clobber existing presets
    const presetId = useEditorLayoutStore.getState().addPreset(area.areaId, 'Default');
    for (const pc of area.pieces) {
      useEditorLayoutStore.getState().addPiece(area.areaId, pc.assetId, pc.pos);
    }
    if (area.ground) useEditorLayoutStore.getState().setPresetGround(area.areaId, presetId, area.ground, area.groundRepeat);
  }

  try { localStorage.setItem(SEED_FLAG, '1'); } catch { /* ignore */ }
}

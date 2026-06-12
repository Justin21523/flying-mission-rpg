import type { Vec3 } from './modelLibrary';

// Kit — authored GLB set-pieces per POLI-world area. Rendered by SceneSetPieceLayer (world mode) AND wrapped
// in EditableObject in Edit Mode, so every seed placement here is gizmo-adjustable (transforms saved as
// sceneEdit overrides). Area ids come from data/world/broomsTownWorld.ts. `scale` is a raw multiplier on the
// GLB (fine-tune in Edit Mode). A first curated dressing pass — extend freely.
export interface SceneSetPiece { assetId: string; position: Vec3; scale?: number; rotationY?: number; }

export const SCENE_SET_PIECES: Record<string, SceneSetPiece[]> = {
  rescue_hq: [
    { assetId: 'interiors/rescue command center 3d model', position: [0, 0, -8], scale: 2 },
    { assetId: 'buildings/bank building 3d model', position: [-16, 0, 6], scale: 1.5, rotationY: 20 },
    { assetId: 'buildings/apartment building 3d model', position: [16, 0, 8], scale: 1.5, rotationY: -20 },
    { assetId: 'decor/stylized tree 3d model', position: [-8, 0, 12], scale: 1.5 },
    { assetId: 'decor/stylized tree 3d model', position: [9, 0, 13], scale: 1.4 },
    { assetId: 'props/standing signpost 3d model', position: [2, 0, 6] },
    { assetId: 'super-wings/Jett+transformer+3d+model', position: [4, 0, 2], scale: 2, rotationY: 180 }, // hero on duty
  ],
  central_plaza: [
    { assetId: 'roads/stylized town square 3d model', position: [0, 0, 0], scale: 2 },
    { assetId: 'props/wooden bench 3d model', position: [6, 0, 4], rotationY: 90 },
    { assetId: 'props/wooden bench 3d model', position: [-6, 0, 4], rotationY: -90 },
    { assetId: 'decor/round leafy bush 3d model', position: [8, 0, -6] },
    { assetId: 'decor/round leafy bush 3d model', position: [-8, 0, -6] },
    { assetId: 'super-wings/Flip pose 3d model', position: [3, 0, -2], scale: 2, rotationY: 200 }, // posing hero
    { assetId: 'super-wings/Donnie pose 02 3d model', position: [-3, 0, -2], scale: 2, rotationY: 160 },
  ],
  harbor_front: [
    { assetId: 'buildings/cartoon harbor entrance 3d model', position: [0, 0, -10], scale: 2 },
    { assetId: 'coasts/lifeguard tower 3d model', position: [-18, 0, 6], scale: 1.5 },
    { assetId: 'decor/fishing boat 3d model', position: [14, 0, 10], scale: 1.4, rotationY: -30 },
    { assetId: 'decor/wooden dock 3d model', position: [10, 0, 16], scale: 1.6 },
    { assetId: 'decor/stylized tree 3d model', position: [-10, 0, 14], scale: 1.3 },
  ],
  coast_beach: [
    { assetId: 'coasts/stylized beach 3d model', position: [0, 0, 0], scale: 2 },
    { assetId: 'coasts/beach umbrella chair 3d model', position: [6, 0, 6], scale: 1.2 },
    { assetId: 'coasts/red white buoy 3d model', position: [-8, 0, 10] },
    { assetId: 'coasts/lifeguard tower 3d model', position: [12, 0, -6], scale: 1.4 },
    { assetId: 'coasts/coastal road 3d model', position: [0, 0, -14], scale: 1.6 },
    { assetId: 'super-wings/Paul airplane 3d model', position: [10, 0, 4], scale: 2, rotationY: -40 }, // rescue plane on the sand
  ],
  school_district: [
    { assetId: 'buildings/architectural building 3d model', position: [0, 0, -10], scale: 2 },
    { assetId: 'decor/stylized tree 3d model', position: [-10, 0, 6], scale: 1.4 },
    { assetId: 'decor/stylized tree 3d model', position: [11, 0, 8], scale: 1.4 },
    { assetId: 'npcs/teacher+npc+3d+model', position: [-4, 0, 5] },
    { assetId: 'npcs/stylized+student+girl+3d+model', position: [-1, 0, 6] },
    { assetId: 'npcs/3d+cartoon+student+npc', position: [2, 0, 5] },
    { assetId: 'npcs/animated school bus 3d model', position: [12, 0, 0], scale: 1.4, rotationY: 90 },
  ],
  residential_lane: [
    { assetId: 'decor/stylized house 3d model', position: [-12, 0, -4], scale: 1.4 },
    { assetId: 'decor/stylized house 3d model', position: [12, 0, -4], scale: 1.4, rotationY: 180 },
    { assetId: 'decor/round leafy bush 3d model', position: [-6, 0, 4] },
    { assetId: 'decor/fence 3d model', position: [0, 0, 8], scale: 1.5 },
    { assetId: 'npcs/park+gardener+3d+model', position: [4, 0, 4] },
  ],
  construction_site: [
    { assetId: 'buildings/construction tower 3d model', position: [0, 0, -8], scale: 2 },
    { assetId: 'roads/cartoon construction zone 3d model', position: [0, 0, 6], scale: 1.6 },
    { assetId: 'props/shipping container 3d model', position: [-10, 0, 2], scale: 1.3 },
    { assetId: 'props/stacked cardboard boxes 3d model', position: [8, 0, 6] },
    { assetId: 'npcs/3d+construction+worker', position: [3, 0, 4] },
    { assetId: 'npcs/cartoon forklift 3d model', position: [-4, 0, 8], scale: 1.2, rotationY: 30 },
    { assetId: 'super-wings/Todd+pose+3d+model', position: [6, 0, 2], scale: 2, rotationY: 200 }, // builder hero
  ],
  industrial_yard: [
    { assetId: 'props/shipping container 3d model', position: [-8, 0, -6], scale: 1.4 },
    { assetId: 'props/shipping container 3d model', position: [-8, 0, 0], scale: 1.4, rotationY: 90 },
    { assetId: 'npcs/container truck 3d model', position: [8, 0, 2], scale: 1.3, rotationY: -60 },
    { assetId: 'npcs/cement mixer truck 3d model', position: [2, 0, 8], scale: 1.3 },
    { assetId: 'decor/highway guardrail 3d model', position: [0, 0, -12], scale: 1.6 },
  ],
  forest_edge: [
    { assetId: 'decor/stylized tree 3d model', position: [-8, 0, -6], scale: 1.6 },
    { assetId: 'decor/stylized tree 3d model', position: [9, 0, -4], scale: 1.8 },
    { assetId: 'decor/stylized tree 3d model', position: [3, 0, 8], scale: 1.5 },
    { assetId: 'decor/round leafy bush 3d model', position: [-4, 0, 4] },
    { assetId: 'decor/round leafy bush 3d model', position: [6, 0, 6] },
    { assetId: 'decor/rock boulder 3d model', position: [-10, 0, 8], scale: 1.3 },
  ],
  desert_outpost: [
    { assetId: 'decor/stylized mountain 3d model', position: [0, 0, -14], scale: 2.5 },
    { assetId: 'decor/round sand patch 3d model', position: [0, 0, 4], scale: 2 },
    { assetId: 'decor/rock boulder 3d model', position: [8, 0, 2], scale: 1.4 },
    { assetId: 'decor/rock boulder 3d model', position: [-9, 0, 6] },
  ],
  main_road: [
    { assetId: 'roads/stylized street intersection 3d model', position: [0, 0, 0], scale: 2 },
    { assetId: 'roads/traffic lights 2 3d model', position: [8, 0, 8] },
    { assetId: 'npcs/cartoon taxi 3d model', position: [-6, 0, 4], scale: 1.2, rotationY: 90 },
    { assetId: 'npcs/cartoon bus 3d model', position: [6, 0, -6], scale: 1.3, rotationY: -90 },
  ],
  commercial_mall: [
    { assetId: 'buildings/convenience store 3d model', position: [-10, 0, -6], scale: 1.6 },
    { assetId: 'buildings/city brew cafe 3d model', position: [10, 0, -6], scale: 1.6 },
    { assetId: 'decor/cartoon shop storefront 3d model', position: [0, 0, -8], scale: 1.6 },
    { assetId: 'npcs/museum guide 3d model', position: [2, 0, 4] },
    { assetId: 'props/potted plant 3d model', position: [-4, 0, 4] },
  ],
};

export const SCENE_SPREAD = 0;
export function spreadOutward(position: Vec3): Vec3 { return position; }

import { BROOMS_TOWN_AREAS } from './poli/broomsTownAreas';
import { getWorldAreas } from '../stores/editorWorldStore';

// Kit — the area registry. An area is a named place with an optional biome theme key. The world
// framework (Phase B) renders the current area and draws travel gates to its `connectedAreaIds`.
// `spawnPoint` is where the player lands when first entering (or when no reciprocal gate is found).
export interface KitArea {
  id: string;
  name: string;
  ambientTheme?: string; // a BIOME_THEMES key (campus/forest/city/…); inferred from id when omitted
  connectedAreaIds?: string[];
  spawnPoint?: { x: number; y: number; z: number };
}

export const SEED_AREAS: KitArea[] = [
  {
    id: 'area_field',
    name: 'Open Field',
    ambientTheme: 'campus',
    connectedAreaIds: ['area_forest'],
    spawnPoint: { x: 0, y: 3, z: 0 },
  },
  {
    id: 'area_forest',
    name: 'Forest Edge',
    ambientTheme: 'forest',
    connectedAreaIds: ['area_field'],
    spawnPoint: { x: 0, y: 3, z: 0 },
  },
  ...BROOMS_TOWN_AREAS,
];

// POLI — the authoritative, editable area list. Once the editorWorldStore is seeded (always, on first
// load) it owns the world; SEED_AREAS remains the ultimate fallback. WorldArea carries `biome`, which the
// biome resolver prefers over `ambientTheme`. Connections are normalised to be SYMMETRIC so a travel gate
// listed in one direction also opens the reverse — new areas only need to list one side.
function normalizeAreas(list: KitArea[]): KitArea[] {
  const byId = new Map(list.map((a) => [a.id, a]));
  const conns = new Map<string, Set<string>>();
  for (const a of list) conns.set(a.id, new Set(a.connectedAreaIds ?? []));
  for (const a of list) {
    for (const target of a.connectedAreaIds ?? []) {
      if (byId.has(target)) conns.get(target)!.add(a.id); // add the reverse edge
    }
  }
  return list.map((a) => ({ ...a, connectedAreaIds: [...(conns.get(a.id) ?? [])] }));
}

export function getAllAreas(): KitArea[] {
  const world = getWorldAreas();
  return normalizeAreas(world.length > 0 ? world : SEED_AREAS);
}

export function getKitArea(id: string): KitArea | undefined {
  return getAllAreas().find((a) => a.id === id);
}

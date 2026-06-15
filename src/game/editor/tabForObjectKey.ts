import { FLIGHT_PATH_ID } from '../../data/game/flightPath';

// Map a selected 3D object's key (sceneEditStore objKey `area#kind#id`, or a path-node key `pathId#node#id`)
// to the Editor Hub tab that authors it — so clicking an object in 3D opens the right tab. Returns null when
// there's no matching tab (the hub then stays where it is). Pure → testable.
export function tabForObjectKey(key: string | null | undefined): string | null {
  if (!key) return null;
  const parts = key.split('#');
  // Path nodes: `${pathId}#node#${nodeId}` — base loop vs world route by the path id.
  if (parts[1] === 'node') return parts[0] === FLIGHT_PATH_ID ? 'gflight' : 'gworld';
  const [area, kind] = parts;
  switch (area) {
    case 'transform': return 'gxform';
    case 'base': return 'gbase';
    // exterior base structures are edited via the 3D gizmo/inspector now (the Exterior tab was removed in
    // favour of the free-form ➕ Add Model palette) — no hub tab to open.
    case 'destination': return kind === 'npc' ? 'gnpc' : 'gdest';
    case 'flight': return parts[2] === 'base_craft' ? 'gflight' : 'gworld';
    default: return null;
  }
}

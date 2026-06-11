import { getPath } from '../../../stores/editorPathStore';
import { getActivePathId } from './worldRoute';
import { objKey } from '../../edit/sceneEditMerge';

// Stable sceneEditStore key for the WORLD_FLIGHT editable craft proxy (area 'flight', kit 'prop' EditKind),
// plus the route-start anchor it sits on. Kept out of the component file so Fast Refresh stays happy.
export const WORLD_CRAFT_KEY = objKey('flight', 'prop', 'world_craft');

// Route start node — the craft's anchor (the authored offset is added on top). Falls back to the origin.
export function routeStartNode(): [number, number, number] {
  const path = getPath(getActivePathId());
  return path?.nodes?.[0]?.position ?? [0, 0, 0];
}

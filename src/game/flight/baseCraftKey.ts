import { getPath } from '../../stores/editorPathStore';
import { FLIGHT_PATH_ID } from '../../data/game/flightPath';
import { objKey } from '../edit/sceneEditMerge';

// Stable sceneEditStore key for the BASE fly-around editable craft proxy (area 'flight', kit 'prop' EditKind)
// + the loop path's start node it anchors to. Kept out of the component file so Fast Refresh stays happy.
export const BASE_CRAFT_KEY = objKey('flight', 'prop', 'base_craft');

export function baseLoopStartNode(): [number, number, number] {
  const path = getPath(FLIGHT_PATH_ID);
  return path?.nodes?.[0]?.position ?? [0, 26, 52];
}

import { useEditorPathStore } from '../../../../stores/editorPathStore';
import type { FlightRoute } from '../../../../types/game/flight';
import { PathNodesEditor } from './PathNodesEditor';

// The world ROUTE's path nodes — a thin wrapper over the shared PathNodesEditor that creates + links a world
// path to the route when none exists yet (the base fly-around loop uses PathNodesEditor directly).
export const PathNodeList = ({ route, update }: { route: FlightRoute; update: (patch: Partial<FlightRoute>) => void }) => {
  const createPath = () => {
    const store = useEditorPathStore.getState();
    const id = store.addPath('world');
    store.updatePath(id, { name: `${route.name} Path`, areaId: 'world', defaultSpeed: Math.max(1, route.virtualDistance / Math.max(1, route.estimatedFlightSec)) });
    update({ pathId: id });
  };
  return <PathNodesEditor pathId={route.pathId} onCreatePath={createPath} createLabel="Create world path" />;
};

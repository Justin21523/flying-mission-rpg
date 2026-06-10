import { Vector3 } from 'three';
import { Html } from '@react-three/drei';
import { useEditorFlightEventStore } from '../../../stores/game/editorFlightEventStore';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';
import { useEditorPathStore } from '../../../stores/editorPathStore';
import { getCurve, samplePos } from '../../path/pathCurve';
import { getActiveRoute, getActivePathId } from './worldRoute';
import { FlightEventVisual } from './FlightEventVisual';

// Edit-Mode gallery — lays the active route's event pool out along the 航道 so every flight-event type is
// visible + tunable in place (uses the SAME FlightEventVisual as play → edit/play parity). Subscribes to
// the event / route / path stores so editing 🌩 Events (kind, colour, size, model, drift…), the route's
// event pool, or the 🛣 Tracks nodes updates the preview live.
const _v = new Vector3();

export const FlightEventPreview = () => {
  const events = useEditorFlightEventStore((s) => s.items);
  const routes = useEditorRouteStore((s) => s.items);
  const paths = useEditorPathStore((s) => s.paths);

  const route = getActiveRoute();
  const pathDef = paths.find((p) => p.id === getActivePathId());
  const cc = pathDef ? getCurve(pathDef) : null;
  if (!cc || routes.length === 0) return null;

  const pool = route && route.eventPoolIds.length > 0 ? events.filter((e) => route.eventPoolIds.includes(e.id)) : events;
  if (pool.length === 0) return null;

  return (
    <>
      {pool.map((e, i) => {
        samplePos(cc.curve, (i + 1) / (pool.length + 1), _v);
        return (
          <group key={e.id} position={[_v.x, _v.y, _v.z]}>
            <FlightEventVisual def={e} />
            <Html center distanceFactor={120} position={[0, e.size + 2, 0]}>
              <div className="pointer-events-none whitespace-nowrap rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] text-sky-100">{e.label}</div>
            </Html>
          </group>
        );
      })}
    </>
  );
};

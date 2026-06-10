import { useMemo } from 'react';
import { Vector3 } from 'three';
import { Html } from '@react-three/drei';
import { getPath } from '../../../stores/editorPathStore';
import { getCurve, samplePos } from '../../path/pathCurve';
import { getActiveRoute, getActivePathId } from './worldRoute';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';
import { useEditorPathStore } from '../../../stores/editorPathStore';
import type { RouteSegmentKind } from '../../../types/game/flight';

// Edit-Mode debug overlay — visualises the active route's segment bands along the 航道 (sampled spheres
// coloured per segment kind + a label at each band start) so segments authored in 🧭 Routes are visible in
// place. Reuses the same curve as play; subscribes to route/path stores so edits update live.
const KIND_COLOR: Record<RouteSegmentKind, string> = {
  cloud: '#cbd5e1',
  weather: '#94a3b8',
  landmark: '#fbbf24',
  stunt: '#fb923c',
  collectible: '#fde047',
  calm: '#86efac',
  approach: '#38bdf8',
};
const _v = new Vector3();

export const WorldFlightDebugGizmos = () => {
  useEditorRouteStore((s) => s.items);
  const paths = useEditorPathStore((s) => s.paths);
  const route = getActiveRoute();
  const def = getPath(getActivePathId());
  const cc = def ? getCurve(def) : null;

  const markers = useMemo(() => {
    if (!cc || !route?.segments) return [];
    const out: { key: string; pos: [number, number, number]; color: string; label?: string }[] = [];
    for (const seg of route.segments) {
      const color = KIND_COLOR[seg.kind];
      const steps = 6;
      for (let i = 0; i <= steps; i++) {
        const u = seg.startU + (seg.endU - seg.startU) * (i / steps);
        samplePos(cc.curve, Math.min(0.999, u), _v);
        out.push({ key: `${seg.id}_${i}`, pos: [_v.x, _v.y, _v.z], color, label: i === 0 ? `${seg.kind} (${seg.id})` : undefined });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cc, route, paths]);

  if (!cc || !route) return null;
  return (
    <>
      {markers.map((m) => (
        <group key={m.key} position={m.pos}>
          <mesh>
            <sphereGeometry args={[6, 10, 10]} />
            <meshBasicMaterial color={m.color} transparent opacity={0.5} />
          </mesh>
          {m.label && (
            <Html center distanceFactor={400} position={[0, 16, 0]}>
              <div className="pointer-events-none whitespace-nowrap rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] text-sky-100">{m.label}</div>
            </Html>
          )}
        </group>
      ))}
    </>
  );
};

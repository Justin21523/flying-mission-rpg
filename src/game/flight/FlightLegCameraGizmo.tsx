import { Html } from '@react-three/drei';
import { Quaternion, Vector3 } from 'three';
import { useFlightPreviewStore } from '../../stores/game/flightPreviewStore';
import { useEditorFlightStore } from '../../stores/game/editorFlightStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { useEditorRouteStore } from '../../stores/game/editorRouteStore';
import { useWorldFlightEditorStore } from '../../stores/game/worldFlightEditorStore';
import { DataBackedPlacement } from '../edit/DataBackedPlacement';
import { flightHandle } from './flightHandle';
import { localFromConfig, configFromLocal } from './legCamConfig';
import { applyCameraTimeTrack, removeFlightTimeTrack, upsertFlightTimeKeyframe } from './flightTimeTracks';

// Edit-only draggable proxy for the per-leg flight camera. Shown while previewing with the camera gizmo on
// (scrub/pause the preview so the craft is stationary, then drag). It sits at the camera eye relative to the
// previewed craft (flightHandle); dragging re-derives distance/height/orbit-angle and bakes them into the
// ACTIVE leg's tuning (WORLD_FLIGHT → worldCam*, else flyAroundCam*) — live + persisted.
const _eye = new Vector3();
const _local = new Vector3();
const _q = new Quaternion();

export const FlightLegCameraGizmo = () => {
  const camGizmo = useFlightPreviewStore((s) => s.camGizmo);
  useFlightPreviewStore((s) => s.u); // recompute the eye when scrubbing
  const tuning = useEditorFlightStore((s) => s.tuning);
  const world = useGameStore((s) => s.phase === 'WORLD_FLIGHT' || s.phase === 'RETURN_FLIGHT');
  const routes = useEditorRouteStore((s) => s.items);
  const selectedRouteId = useWorldFlightEditorStore((s) => s.selectedRouteId);
  const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? routes[0];
  if (!camGizmo) return null;

  const u = useFlightPreviewStore.getState().u;
  const baseCamera = world
    ? { distance: tuning.worldCamDistance, height: tuning.worldCamHeight, angleDeg: tuning.worldCamAngleDeg }
    : { distance: tuning.flyAroundCamDistance, height: tuning.flyAroundCamHeight, angleDeg: tuning.flyAroundCamAngleDeg };
  const authoredCamera = applyCameraTimeTrack(baseCamera, world ? selectedRoute?.timeTracks : tuning.flyAroundTimeTracks, u);
  const off = localFromConfig(authoredCamera.distance, authoredCamera.height, authoredCamera.angleDeg);
  _eye.set(off[0], off[1], off[2]).applyQuaternion(flightHandle.quat).add(flightHandle.pos);

  const onMove = (p: [number, number, number]) => {
    _local.set(p[0] - flightHandle.pos.x, p[1] - flightHandle.pos.y, p[2] - flightHandle.pos.z)
      .applyQuaternion(_q.copy(flightHandle.quat).invert());
    const c = configFromLocal(_local.x, _local.y, _local.z);
    if (world && selectedRoute) {
      useEditorRouteStore.getState().update(selectedRoute.id, {
        timeTracks: upsertFlightTimeKeyframe(selectedRoute.timeTracks, { kind: 'camera' }, u, c),
      });
      return;
    }
    useEditorFlightStore.getState().update({
      flyAroundTimeTracks: upsertFlightTimeKeyframe(useEditorFlightStore.getState().tuning.flyAroundTimeTracks, { kind: 'camera' }, u, c),
    });
  };
  const onDelete = () => {
    if (world && selectedRoute) {
      useEditorRouteStore.getState().update(selectedRoute.id, { timeTracks: removeFlightTimeTrack(selectedRoute.timeTracks, { kind: 'camera' }) });
      return;
    }
    useEditorFlightStore.getState().update({ flyAroundTimeTracks: removeFlightTimeTrack(useEditorFlightStore.getState().tuning.flyAroundTimeTracks, { kind: 'camera' }) });
  };

  return (
    <DataBackedPlacement objKey="flight#legcam" position={[_eye.x, _eye.y, _eye.z]} onMove={onMove} onDelete={onDelete} color="#a855f7">
      <mesh><boxGeometry args={[0.5, 0.4, 0.7]} /><meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.5} /></mesh>
      <Html center distanceFactor={14} position={[0, 0.7, 0]}>
        <div className="pointer-events-none whitespace-nowrap rounded bg-slate-950/80 px-1 text-[9px] text-violet-200">{world ? 'world cam' : 'base cam'}</div>
      </Html>
    </DataBackedPlacement>
  );
};

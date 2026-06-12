import { Html } from '@react-three/drei';
import { Quaternion, Vector3 } from 'three';
import { useFlightPreviewStore } from '../../stores/game/flightPreviewStore';
import { useEditorFlightStore } from '../../stores/game/editorFlightStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { DataBackedPlacement } from '../edit/DataBackedPlacement';
import { flightHandle } from './flightHandle';
import { localFromConfig, configFromLocal } from './legCamConfig';
import type { FlightTuning } from '../../types/game/flightControl';

// Edit-only draggable proxy for the per-leg flight camera. Shown while previewing with the camera gizmo on
// (scrub/pause the preview so the craft is stationary, then drag). It sits at the camera eye relative to the
// previewed craft (flightHandle); dragging re-derives distance/height/orbit-angle and bakes them into the
// ACTIVE leg's tuning (WORLD_FLIGHT → worldCam*, else flyAroundCam*) — live + persisted.
const _eye = new Vector3();
const _local = new Vector3();
const _q = new Quaternion();

export const FlightLegCameraGizmo = () => {
  const camGizmo = useFlightPreviewStore((s) => s.camGizmo);
  const previewing = useFlightPreviewStore((s) => s.playing || s.u > 0.001);
  useFlightPreviewStore((s) => s.u); // recompute the eye when scrubbing
  const tuning = useEditorFlightStore((s) => s.tuning);
  const world = useGameStore((s) => s.phase === 'WORLD_FLIGHT' || s.phase === 'RETURN_FLIGHT');
  if (!camGizmo || !previewing) return null;

  const dist = world ? tuning.worldCamDistance : tuning.flyAroundCamDistance;
  const height = world ? tuning.worldCamHeight : tuning.flyAroundCamHeight;
  const angle = world ? tuning.worldCamAngleDeg : tuning.flyAroundCamAngleDeg;
  const off = localFromConfig(dist, height, angle);
  _eye.set(off[0], off[1], off[2]).applyQuaternion(flightHandle.quat).add(flightHandle.pos);

  const onMove = (p: [number, number, number]) => {
    _local.set(p[0] - flightHandle.pos.x, p[1] - flightHandle.pos.y, p[2] - flightHandle.pos.z)
      .applyQuaternion(_q.copy(flightHandle.quat).invert());
    const c = configFromLocal(_local.x, _local.y, _local.z);
    const patch: Partial<FlightTuning> = world
      ? { worldCamDistance: c.distance, worldCamHeight: c.height, worldCamAngleDeg: c.angleDeg }
      : { flyAroundCamDistance: c.distance, flyAroundCamHeight: c.height, flyAroundCamAngleDeg: c.angleDeg };
    useEditorFlightStore.getState().update(patch);
  };

  return (
    <DataBackedPlacement objKey="flight#legcam" position={[_eye.x, _eye.y, _eye.z]} onMove={onMove} color="#a855f7">
      <mesh><boxGeometry args={[0.5, 0.4, 0.7]} /><meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.5} /></mesh>
      <Html center distanceFactor={14} position={[0, 0.7, 0]}>
        <div className="pointer-events-none whitespace-nowrap rounded bg-slate-950/80 px-1 text-[9px] text-violet-200">{world ? 'world cam' : 'base cam'}</div>
      </Html>
    </DataBackedPlacement>
  );
};

import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Euler, Quaternion, type PerspectiveCamera } from 'three';
import { getFlightTuning } from '../../stores/game/editorFlightStore';
import { useFlightRuntimeStore } from '../../stores/game/flightRuntimeStore';
import { flightHandle } from './flightHandle';

// Third-person flight camera: follows behind+above, FOV widens with speed, pulls back under throttle,
// partially follows roll (comfort mode halves it). Bounded roll + camera.up keep it from ever flipping.
const _off = new Vector3();
const _e = new Euler(0, 0, 0, 'YXZ');
const _q = new Quaternion();
const _look = new Vector3();
const _fwd = new Vector3();
const _up = new Vector3();
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, t);

export const FlightCamera = () => {
  const { camera } = useThree();

  // Restore a sane camera on exit (FollowCamera assumes world-up + ~50° FOV).
  useEffect(() => {
    const cam = camera as PerspectiveCamera;
    return () => {
      cam.up.set(0, 1, 0);
      cam.fov = 50;
      cam.updateProjectionMatrix();
    };
  }, [camera]);

  useFrame((state, dtRaw) => {
    const cam = state.camera as PerspectiveCamera;
    const dt = Math.min(dtRaw, 0.05);
    const tuning = getFlightTuning();
    const comfort = useFlightRuntimeStore.getState().comfort;
    const k = 1 - Math.exp(-(comfort ? 5 : 8) * dt);

    _e.setFromQuaternion(flightHandle.quat); // x pitch, y yaw, z roll
    const rollFollow = comfort ? tuning.rollFollow * 0.4 : tuning.rollFollow;
    _e.set(_e.x * 0.5, _e.y, _e.z * rollFollow);
    _q.setFromEuler(_e);

    const pull = tuning.camPullback * Math.min(1, flightHandle.speed / Math.max(1, tuning.maxSpeed));
    _off.set(0, tuning.camHeight, tuning.camDistance + pull).applyQuaternion(_q).add(flightHandle.pos);
    cam.position.lerp(_off, k);

    _fwd.set(0, 0, -1).applyQuaternion(flightHandle.quat);
    _look.copy(flightHandle.pos).addScaledVector(_fwd, 6);
    _up.set(0, 1, 0).applyAxisAngle(_fwd, _e.z); // partial, bounded roll → never flips
    cam.up.copy(_up);
    cam.lookAt(_look);

    const fovMax = comfort ? tuning.fovBase + (tuning.fovMax - tuning.fovBase) * 0.5 : tuning.fovMax;
    const targetFov = tuning.fovBase + (fovMax - tuning.fovBase) * Math.min(1, flightHandle.speed / Math.max(1, tuning.maxSpeed));
    cam.fov = lerp(cam.fov, targetFov, k);
    cam.updateProjectionMatrix();
  });

  return null;
};

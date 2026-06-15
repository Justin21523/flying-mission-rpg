import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Euler, Vector3, type PerspectiveCamera } from 'three';
import { useFlightTimelineStore } from '../../stores/game/flightTimelineStore';
import { getActiveFlightPhase } from '../../stores/game/flightPhaseStore';
import { resolveCameraAtTime } from './flightPhaseRuntime';
import { flightHandle } from './flightHandle';

// Drives the camera from the active phase's authored camera keyframes at the timeline currentTime (seconds).
// Mounted when the phase has keyframes — in Play always, and in Edit when "camera preview" is on. World-space
// shots; followTargetId 'craft' aims the shot at the live craft (flightHandle). Scrub = instant (snaps when
// paused); plays smoothly (eases) so the authored transitionType reads. Restores a sane camera on unmount.
const _target = new Vector3();
const _pos = new Vector3();
const _fwd = new Vector3();
const _e = new Euler(0, 0, 0, 'YXZ');
const DEG = Math.PI / 180;

export const FlightPhaseCameraController = () => {
  const { camera } = useThree();

  useEffect(() => {
    const cam = camera as PerspectiveCamera;
    return () => { cam.up.set(0, 1, 0); cam.fov = 50; cam.updateProjectionMatrix(); };
  }, [camera]);

  useFrame((state, dtRaw) => {
    const phase = getActiveFlightPhase();
    if (!phase || phase.cameraKeyframes.length === 0) return;
    const tl = useFlightTimelineStore.getState();
    const shot = resolveCameraAtTime(phase.cameraKeyframes, tl.currentTime);
    if (!shot) return;
    const cam = state.camera as PerspectiveCamera;

    _pos.set(...shot.position);
    if (shot.followTargetId === 'craft') {
      _target.copy(flightHandle.pos);
    } else if (shot.lookAt) {
      _target.set(...shot.lookAt);
    } else {
      _e.set(shot.rotation[0] * DEG, shot.rotation[1] * DEG, shot.rotation[2] * DEG);
      _fwd.set(0, 0, -1).applyEuler(_e);
      _target.copy(_pos).add(_fwd.multiplyScalar(10));
    }

    if (tl.playing) {
      const k = 1 - Math.exp(-9 * Math.min(dtRaw, 0.05));
      cam.position.lerp(_pos, k);
      cam.fov += (shot.fov - cam.fov) * k;
    } else {
      cam.position.copy(_pos); // scrub → instant
      cam.fov = shot.fov;
    }
    cam.up.set(0, 1, 0);
    cam.lookAt(_target);
    cam.updateProjectionMatrix();
  });

  return null;
};

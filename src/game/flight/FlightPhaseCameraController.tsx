import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Euler, Vector3, type PerspectiveCamera } from 'three';
import { useFlightTimelineStore } from '../../stores/game/flightTimelineStore';
import { getActiveFlightPhase } from '../../stores/game/flightPhaseStore';
import { resolveCameraAtTime } from './flightPhaseRuntime';
import { flightHandle } from './flightHandle';
import type { Vec3Tuple } from '../../types/path';

// Drives the camera from the active phase's camera keyframes at the timeline currentTime, applying each shot's
// cameraMode (follow / lookAtNode / lookAtNextNode / fixed / orbit). This is the SINGLE camera path used by both
// Play and Edit camera-preview, so the previewed shot equals the played shot. Scrub = instant; play = eased
// (per-shot damping). Restores a sane camera on unmount.
const _pos = new Vector3();
const _target = new Vector3();
const _fwd = new Vector3();
const _off = new Vector3();
const _e = new Euler(0, 0, 0, 'YXZ');
const DEG = Math.PI / 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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
    const nodes = phase.path.nodes;
    const nodePos = (id?: string): Vec3Tuple | undefined => (id ? nodes.find((n) => n.nodeId === id)?.position : undefined);
    const nextNodePos = (id?: string): Vec3Tuple | undefined => {
      const i = id ? nodes.findIndex((n) => n.nodeId === id) : -1;
      return i >= 0 ? nodes[(i + 1) % nodes.length]?.position : undefined;
    };

    // desired camera position (_pos) + look target (_target) by mode
    if (shot.cameraMode === 'follow') {
      _fwd.set(0, 0, -1).applyQuaternion(flightHandle.quat); // craft forward
      const off = shot.followOffset ?? [0, 0, 0];
      _off.set(off[0], (shot.height ?? 3) + off[1], off[2]);
      _pos.copy(flightHandle.pos).addScaledVector(_fwd, -(shot.distance ?? 9)).add(_off); // trail behind + offset
      _target.copy(flightHandle.pos);
    } else if (shot.cameraMode === 'orbit') {
      const tp = nodePos(shot.nodeId) ?? [flightHandle.pos.x, flightHandle.pos.y, flightHandle.pos.z];
      const ang = (shot.startAngle != null && shot.endAngle != null)
        ? lerp(shot.startAngle, shot.endAngle, shot.spanProgress) * DEG
        : (state.clock.elapsedTime * (shot.orbitSpeed ?? 0.3) * Math.PI * 2);
      const r = shot.orbitRadius ?? 14;
      _pos.set(tp[0] + Math.sin(ang) * r, tp[1] + (shot.orbitHeight ?? 6), tp[2] + Math.cos(ang) * r);
      _target.set(...tp);
    } else if (shot.cameraMode === 'lookAtNode' || shot.cameraMode === 'lookAtNextNode') {
      _pos.set(...shot.position);
      const tp = (shot.cameraMode === 'lookAtNextNode' ? nextNodePos(shot.nodeId) : nodePos(shot.nodeId)) ?? shot.lookAt ?? [flightHandle.pos.x, flightHandle.pos.y, flightHandle.pos.z];
      _target.set(...tp);
    } else { // fixed
      _pos.set(...shot.position);
      if (shot.lookAt) _target.set(...shot.lookAt);
      else { _e.set(shot.rotation[0] * DEG, shot.rotation[1] * DEG, shot.rotation[2] * DEG); _fwd.set(0, 0, -1).applyEuler(_e); _target.copy(_pos).add(_fwd.multiplyScalar(10)); }
    }

    if (tl.playing) {
      const rate = lerp(20, 3, Math.max(0, Math.min(1, shot.damping ?? 0.4))); // higher damping → slower follow
      const k = 1 - Math.exp(-rate * Math.min(dtRaw, 0.05));
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

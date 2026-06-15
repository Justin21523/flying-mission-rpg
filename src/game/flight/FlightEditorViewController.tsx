import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useFlightTimelineStore } from '../../stores/game/flightTimelineStore';
import { getActiveFlightPhase } from '../../stores/game/flightPhaseStore';
import { computePathBounds, viewDirection, frameDistance } from '../camera/editorCameraViews';
import { flightHandle } from './flightHandle';

// Applies the Flight Phase editor VIEW PRESETS (Overview / Top / Side / Front / Follow / Free) to the shared
// OrbitControls used in Edit Mode. Overview/Top/Side/Front snap once when the view (nonce) changes; Follow
// retargets the orbit onto the live craft every frame (still user-rotatable); Free leaves the user's orbit
// alone. Only mounted inside the flight scene in Edit Mode, so it never hijacks other scenes' cameras.
const _off = new Vector3();
const _target = new Vector3();

export const FlightEditorViewController = () => {
  const lastNonce = useRef(-1);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { target: Vector3; update: () => void } | null;

  useFrame(() => {
    if (!controls) return;
    const tl = useFlightTimelineStore.getState();
    const apply = tl.viewNonce !== lastNonce.current;

    if (tl.viewMode === 'follow') {
      // Retarget the orbit onto the craft, preserving the user's angle/zoom offset.
      _off.copy(camera.position).sub(controls.target);
      controls.target.copy(flightHandle.pos);
      camera.position.copy(flightHandle.pos).add(_off);
      controls.update();
      lastNonce.current = tl.viewNonce;
      return;
    }

    if (!apply) return;
    lastNonce.current = tl.viewNonce;
    if (tl.viewMode === 'free') return; // leave the user's orbit untouched

    const phase = getActiveFlightPhase();
    if (!phase) return;
    const { center, radius } = computePathBounds(phase);
    const dir = viewDirection(tl.viewMode);
    if (!dir) return;
    _target.set(...center);
    const dist = frameDistance(radius);
    controls.target.copy(_target);
    camera.position.set(center[0] + dir[0] * dist, center[1] + dir[1] * dist, center[2] + dir[2] * dist);
    controls.update();
  });

  return null;
};

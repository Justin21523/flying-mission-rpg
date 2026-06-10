import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useBaseRuntimeStore } from '../../stores/game/baseRuntimeStore';
import { usePlayerStore } from '../../stores/playerStore';

// Cinematic camera ONLY during the lift descent: a lowered, looking-down shot that rides the car into the
// shaft with a subtle hand-held shake. Mounted AFTER FollowCamera in BaseScene so its useFrame runs last
// and overrides the camera while descending; the rest of the time it's a no-op and FollowCamera drives.
const _look = new Vector3();

export const LiftCinematicCamera = () => {
  const { camera } = useThree();
  useFrame((state) => {
    if (useBaseRuntimeStore.getState().liftPhase !== 'descending') return;
    const p = usePlayerStore.getState().position;
    if (!p) return;
    const t = state.clock.elapsedTime;
    const shakeX = Math.sin(t * 23) * 0.06 + Math.sin(t * 37) * 0.03;
    const shakeY = Math.cos(t * 29) * 0.05;
    // High, slightly-behind shot looking down at the descending car → emphasises the drop into the shaft.
    camera.position.set(p.x + shakeX, p.y + 5.5 + shakeY, p.z + 6);
    _look.set(p.x, p.y - 1.2, p.z);
    camera.lookAt(_look);
  });
  return null;
};

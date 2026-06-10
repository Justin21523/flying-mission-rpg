import { useFrame, useThree } from '@react-three/fiber';
import { useBaseRuntimeStore } from '../../stores/game/baseRuntimeStore';
import { BASE_HALF_EXTENT, BASE_CEILING_Y } from '../../data/game/baseLayout';

// Keeps the orbit camera INSIDE the enclosed base room (no peeking through the walls into the void).
// Runs after FollowCamera (mount order) to clamp its result; skipped during the lift descent so the
// cinematic camera can dip below the floor into the shaft.
const M = 0.6;

export const BaseCameraClamp = () => {
  const { camera } = useThree();
  useFrame(() => {
    if (useBaseRuntimeStore.getState().liftPhase === 'descending') return;
    const lim = BASE_HALF_EXTENT - M;
    const p = camera.position;
    const x = Math.max(-lim, Math.min(lim, p.x));
    const z = Math.max(-lim, Math.min(lim, p.z));
    const y = Math.max(0.4, Math.min(BASE_CEILING_Y - M, p.y));
    camera.position.set(x, y, z);
  });
  return null;
};

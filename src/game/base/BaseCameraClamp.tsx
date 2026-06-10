import { useFrame, useThree } from '@react-three/fiber';
import { useBaseRuntimeStore } from '../../stores/game/baseRuntimeStore';
import { getBaseParts } from '../../stores/game/editorBaseLayoutStore';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import { basePartKey } from './basePartKey';
import { BASE_HALF_EXTENT, BASE_CEILING_Y } from '../../data/game/baseLayout';

// Keeps the (still user-controllable) orbit camera in-bounds: inside the room while driving, and inside
// the LIFT SHAFT footprint during/after the descent — so it can't drift outside the shaft. Runs after
// FollowCamera (mount order) to clamp its result; the user can still orbit/zoom within the bounds.
const M = 0.5;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const BaseCameraClamp = () => {
  const { camera } = useThree();
  useFrame(() => {
    const liftPhase = useBaseRuntimeStore.getState().liftPhase;
    const p = camera.position;

    if (liftPhase === 'idle') {
      const lim = BASE_HALF_EXTENT - M;
      camera.position.set(clamp(p.x, -lim, lim), clamp(p.y, 0.4, BASE_CEILING_Y - M), clamp(p.z, -lim, lim));
      return;
    }

    // During/after the lift: confine to the shaft column around the platform centre.
    const lift = getBaseParts().find((part) => part.kind === 'lift_platform');
    if (!lift) return;
    const ov = useSceneEditStore.getState().overrides[basePartKey(lift.id)]?.position as [number, number, number] | undefined;
    const cx = ov ? ov[0] : lift.position[0];
    const cz = ov ? ov[2] : lift.position[2];
    const half = Math.max(lift.size[0], lift.size[2]) / 2 + 0.4; // just inside the shaft walls
    camera.position.set(clamp(p.x, cx - half, cx + half), p.y, clamp(p.z, cz - half, cz + half));
  });
  return null;
};

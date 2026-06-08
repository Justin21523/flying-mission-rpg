import { useMemo } from 'react';
import { Box3, Group, Vector3 } from 'three';
import { useGLTF } from '@react-three/drei';

// POLI — character GLBs come from many sources with wildly different native scales (some are
// authored in centimetres → hundreds of units tall, which would swallow the camera and make
// the player look stationary while only the camera appears to move). This normalizes any GLB
// to a target height with its feet at y=0, so every model behaves predictably regardless of
// its export units. Returns a freshly-cloned, recentred Group ready to drop into a <primitive>.
const _box = new Box3();
const _size = new Vector3();
const _center = new Vector3();

export function useNormalizedGlb(path: string, targetHeight: number): Group {
  const { scene } = useGLTF(path);
  return useMemo(() => {
    const clone = scene.clone(true);
    _box.setFromObject(clone);
    _box.getSize(_size);
    _box.getCenter(_center);

    const nativeHeight = _size.y || 1;
    const scale = targetHeight / nativeHeight;

    // Wrap in a group so we can scale + recentre without mutating the cached source scene.
    const wrapper = new Group();
    // Recentre on X/Z and lift so the model's lowest point sits at local y=0.
    clone.position.set(-_center.x, -_box.min.y, -_center.z);
    wrapper.add(clone);
    wrapper.scale.setScalar(scale);
    return wrapper;
  }, [scene, targetHeight]);
}

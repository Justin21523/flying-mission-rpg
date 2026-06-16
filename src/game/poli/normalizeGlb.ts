import { useMemo } from 'react';
import { Box3, Vector3 } from 'three';
import type { Object3D } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useGLTF } from '@react-three/drei';

// POLI — character GLBs come from many sources with wildly different native scales (some are
// authored in centimetres → hundreds of units tall, which would swallow the camera) AND some are
// authored off-centre from their pivot (which would make them render far from the entity, looking
// like they "disappeared into the background"). This measures the GLB and returns a cloned scene
// plus the uniform scale + offset to render it at `targetHeight`, recentred on X/Z with its feet at
// local y=0. The caller applies `scale`/`position` on a <primitive> so React owns attach/detach.
export interface NormalizedGlb {
  scene: Object3D;
  scale: number;
  offset: [number, number, number];
}

export interface GlbNormalization {
  scale: number;                       // uniform scale to render the object at `targetHeight`
  offset: [number, number, number];    // recenter offset (X/Z centred, feet at y=0), pre-scaled
}

// Pure measure of an Object3D's bounding box → the uniform scale + recenter offset to render it at
// `targetHeight`. Extracted from useNormalizedGlb so non-hook callers (e.g. the VFX model-particle pool,
// which clones N times) can normalize too. Degenerate / non-finite boxes fall back to no scaling.
export function measureNormalization(object: Object3D, targetHeight: number): GlbNormalization {
  const box = new Box3().setFromObject(object);
  const size = new Vector3();
  const center = new Vector3();
  box.getSize(size);
  box.getCenter(center);

  const nativeHeight = Number.isFinite(size.y) && size.y > 1e-4 ? size.y : 1;
  const scale = targetHeight / nativeHeight;
  const ox = Number.isFinite(center.x) ? -center.x * scale : 0;
  const oy = Number.isFinite(box.min.y) ? -box.min.y * scale : 0; // feet at y=0
  const oz = Number.isFinite(center.z) ? -center.z * scale : 0;
  return { scale, offset: [ox, oy, oz] };
}

export function useNormalizedGlb(path: string, targetHeight: number): NormalizedGlb {
  const { scene } = useGLTF(path);
  return useMemo(() => {
    // SkeletonUtils.clone so rigged/skinned character GLBs clone correctly (scene.clone breaks them).
    const clone = SkeletonUtils.clone(scene);
    const { scale, offset } = measureNormalization(clone, targetHeight);
    return { scene: clone, scale, offset };
  }, [scene, targetHeight]);
}

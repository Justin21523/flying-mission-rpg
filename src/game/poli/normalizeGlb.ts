import { useMemo } from 'react';
import { Box3, Vector3 } from 'three';
import type { Object3D } from 'three';
import { useGLTF } from '@react-three/drei';

// POLI — character GLBs come from many sources with wildly different native scales (some are
// authored in centimetres → hundreds of units tall, which would swallow the camera and make the
// player look stationary / invisible). This measures the GLB and returns a cloned scene plus the
// uniform scale + y-offset to render it at `targetHeight` with its feet at local y=0. Idiomatic
// R3F: the caller applies `scale`/`position` on a <primitive>, so React owns attach/detach (no
// hand-built Group returned from a hook — that pattern broke on transform remounts).
export interface NormalizedGlb {
  scene: Object3D;
  scale: number;
  yOffset: number;
}

export function useNormalizedGlb(path: string, targetHeight: number): NormalizedGlb {
  const { scene } = useGLTF(path);
  return useMemo(() => {
    const clone = scene.clone(true);
    // Fresh locals (no shared module temps) so concurrent measurements can't clobber each other.
    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    box.getSize(size);

    // Guard against an empty / degenerate box (non-finite → fall back to no scaling).
    const nativeHeight = Number.isFinite(size.y) && size.y > 1e-4 ? size.y : 1;
    const scale = targetHeight / nativeHeight;
    const minY = Number.isFinite(box.min.y) ? box.min.y : 0;
    const yOffset = -minY * scale; // lift so the lowest point sits at local y=0 after scaling

    return { scene: clone, scale, yOffset };
  }, [scene, targetHeight]);
}

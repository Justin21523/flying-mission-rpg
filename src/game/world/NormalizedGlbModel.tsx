import React, { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { resolveModelAsset } from '../../stores/modelStudioStore';
import { defaultNormalizeFor } from './normalizeDefault';

// POLI — a size-NORMALISED GLB renderer for world/layout placements. Models in the library are authored at
// wildly different scales; this scales each so its largest dimension equals `target` world units, recenters
// it on X/Z, and drops its feet to y=0 — so an auto-placed building, prop or vehicle all land at a sane,
// predictable size. `target` is editable per layout piece (🗺 World tab); a per-folder default is used when
// unset. Fails soft to nothing on a bad/missing GLB (LayoutLayer wraps it in Suspense).

const GlbInner = ({ assetId, target }: { assetId: string; target: number }) => {
  const asset = resolveModelAsset(assetId)!;
  const { scene } = useGLTF(encodeURI(asset.path));
  const { object, scale, offset } = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene);
    const box = new Box3().setFromObject(cloned);
    const size = new Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = target / maxDim;
    const center = new Vector3();
    box.getCenter(center);
    // Recenter on X/Z, sit feet at y=0 (after scaling).
    const off: [number, number, number] = [-center.x * s, -box.min.y * s, -center.z * s];
    return { object: cloned, scale: s, offset: off };
  }, [scene, target]);
  return (
    <group scale={scale} position={offset}>
      <primitive object={object} />
    </group>
  );
};

class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export function NormalizedGlbModel({ assetId, target }: { assetId: string; target?: number }) {
  if (!resolveModelAsset(assetId)) return null;
  const t = target && target > 0 ? target : defaultNormalizeFor(assetId);
  return (
    <Boundary>
      <Suspense fallback={null}>
        <GlbInner assetId={assetId} target={t} />
      </Suspense>
    </Boundary>
  );
}

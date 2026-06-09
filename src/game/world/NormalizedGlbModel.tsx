import React, { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { Box3, Vector3, type Group } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { resolveModelAsset } from '../../stores/modelStudioStore';
import { defaultNormalizeFor } from './normalizeDefault';
import { useDistanceCull } from '../perf/useDistanceCull';
import type { CollisionShape, Vec3 } from '../edit/sceneEditMerge';

// POLI — a size-NORMALISED GLB renderer for world/layout placements. Models in the library are authored at
// wildly different scales; this scales each so its largest dimension equals `target` world units, recenters
// it on X/Z, and drops its feet to y=0 — so an auto-placed building, prop or vehicle all land at a sane,
// predictable size. `target` is editable per layout piece (🗺 World tab); a per-folder default is used unset.
//
// PHYSICS: when `collision` is set (play mode), the loaded model is wrapped in a fixed Rapier body with the
// chosen collider shape (default 'trimesh' = exact, walk-through-gaps). The RigidBody mounts INSIDE the
// Suspense boundary — i.e. only after the GLB resolves — so Rapier builds the collider from real geometry
// (the kit's CollidableGlb pattern). In edit mode it's rendered visual-only (EditableObject owns the gizmo).
// Fails soft to nothing on a bad/missing GLB.

interface Props {
  assetId: string;
  target?: number;
  collision?: CollisionShape;   // when set & ≠ 'none' → wrap in a fixed RigidBody with this collider
  position?: Vec3;              // placement (used only in the collision path; RigidBody owns the transform)
  rotation?: Vec3;
  scale?: number | Vec3;
}

const GlbInner = ({ assetId, target, collision, position, rotation, scale }: Props & { target: number }) => {
  const asset = resolveModelAsset(assetId)!;
  const { scene } = useGLTF(encodeURI(asset.path));
  const { object, normScale, offset } = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene);
    const box = new Box3().setFromObject(cloned);
    const size = new Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = target / maxDim;
    const center = new Vector3();
    box.getCenter(center);
    const off: [number, number, number] = [-center.x * s, -box.min.y * s, -center.z * s];
    return { object: cloned, normScale: s, offset: off };
  }, [scene, target]);

  const cullRef = useDistanceCull<Group>(); // hide when far from the player (Play Mode perf)
  // The normalised visual at local origin (feet on the ground).
  const visual = (
    <group ref={cullRef} scale={normScale} position={offset}>
      <primitive object={object} />
    </group>
  );

  if (collision && collision !== 'none') {
    const colliders = collision === 'hull' ? 'hull' : collision === 'cuboid' ? 'cuboid' : 'trimesh';
    return (
      <RigidBody type="fixed" colliders={colliders} position={position} rotation={rotation}>
        <group scale={scale ?? 1}>{visual}</group>
      </RigidBody>
    );
  }
  return visual;
};

class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export function NormalizedGlbModel({ assetId, target, collision, position, rotation, scale }: Props) {
  if (!resolveModelAsset(assetId)) return null;
  const t = target && target > 0 ? target : defaultNormalizeFor(assetId);
  return (
    <Boundary>
      <Suspense fallback={null}>
        <GlbInner assetId={assetId} target={t} collision={collision} position={position} rotation={rotation} scale={scale} />
      </Suspense>
    </Boundary>
  );
}

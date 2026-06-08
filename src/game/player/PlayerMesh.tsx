import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';
import { useTransformStore } from '../../stores/transformStore';

// Poli transforms between two forms (toggle with T): car (default) and robot (transformer).
//
// CRITICAL: BOTH models are ALWAYS mounted together (one <Suspense> wraps both, so once they've
// loaded they stay mounted forever) and they live inside the same moving+rotating group (in
// Player.tsx). Three keeps updating the world matrix of an object even while `visible={false}`, so
// the hidden form keeps following the body — meaning a transform just flips visibility and the
// revealed model is already at the correct current position (never a stale spot, never a remount,
// never a disappear). Each model is auto-normalized: recentred on X/Z (so an off-centre pivot
// doesn't fling it away) with feet at local y=0. Paths default to Poli but are overridable in the
// POLI tab (Vehicle field = car, Robot field = robot).

const DEFAULT_CAR = '/models/characters/Poli car 3d model.glb';
const DEFAULT_ROBOT = '/models/characters/Poli+transformer+3d+model.glb';
const CAR_HEIGHT = 1.4;
const ROBOT_HEIGHT = 1.9;

useGLTF.preload(DEFAULT_CAR);
useGLTF.preload(DEFAULT_ROBOT);

const Capsule = () => (
  <mesh castShadow position={[0, 0, 0]}>
    <capsuleGeometry args={[0.45, 1.0, 8, 16]} />
    <meshStandardMaterial color="#3b82f6" roughness={0.5} metalness={0.2} />
  </mesh>
);

const ModelView = ({ path, height, visible }: { path: string; height: number; visible: boolean }) => {
  const { scene } = useGLTF(path);
  const { clone, scale, offset } = useMemo(() => {
    // SkeletonUtils.clone (not scene.clone) so RIGGED/skinned models — like the transformer — clone
    // correctly instead of collapsing to nothing. Same approach the kit's GLB renderers use.
    const c = SkeletonUtils.clone(scene);
    const box = new Box3().setFromObject(c);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    const nativeH = Number.isFinite(size.y) && size.y > 1e-4 ? size.y : 1;
    const s = height / nativeH;
    const ox = Number.isFinite(center.x) ? -center.x * s : 0;
    const oy = Number.isFinite(box.min.y) ? -box.min.y * s : 0;
    const oz = Number.isFinite(center.z) ? -center.z * s : 0;
    return { clone: c, scale: s, offset: [ox, oy, oz] as [number, number, number] };
  }, [scene, height]);
  return <primitive object={clone} scale={scale} position={offset} visible={visible} />;
};

// Both models, always mounted; only visibility differs.
const BothModels = ({ carPath, robotPath, form }: { carPath: string; robotPath: string; form: 'car' | 'robot' }) => (
  <>
    <ModelView path={carPath} height={CAR_HEIGHT} visible={form === 'car'} />
    <ModelView path={robotPath} height={ROBOT_HEIGHT} visible={form === 'robot'} />
  </>
);

export const PlayerMesh = () => {
  const form = useTransformStore((s) => s.form);
  const ov = useEditorPoliCharacterStore((s) => s.overrides['poli']);
  const carPath = ov?.modelVehiclePath || DEFAULT_CAR;
  const robotPath = ov?.modelRobotPath || DEFAULT_ROBOT;

  // ONE Suspense around both: a capsule shows only during the initial load; after that both models
  // are permanently mounted and a transform is a pure visibility flip.
  return (
    <Suspense fallback={<Capsule />}>
      <BothModels carPath={carPath} robotPath={robotPath} form={form} />
    </Suspense>
  );
};

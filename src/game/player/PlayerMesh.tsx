import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';
import { useTransformStore } from '../../stores/transformStore';

// Poli transforms between two forms (toggle with T):
//   • car   (default) → DEFAULT_CAR     ("Poli car 3d model.glb")
//   • robot           → DEFAULT_ROBOT   ("Poli+transformer+3d+model.glb")
//
// BOTH models stay mounted the whole time and we only toggle `visible`, so transforming never
// unmounts/remounts a GLB (the player can't "disappear" on T). Each is auto-normalized: recentred
// on X/Z (so an off-centre pivot doesn't fling it into the background) with feet at local y=0.
// Paths default to Poli but are overridable in Edit Mode → POLI tab (Vehicle = car, Robot = robot).

const DEFAULT_CAR = '/models/characters/Poli car 3d model.glb';
const DEFAULT_ROBOT = '/models/characters/Poli+transformer+3d+model.glb';
const CAR_HEIGHT = 1.4;
const ROBOT_HEIGHT = 1.9;

useGLTF.preload(DEFAULT_CAR);
useGLTF.preload(DEFAULT_ROBOT);

const Capsule = ({ color }: { color: string }) => (
  <mesh castShadow position={[0, 0, 0]}>
    <capsuleGeometry args={[0.45, 1.0, 8, 16]} />
    <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
  </mesh>
);

// One normalized, cloned GLB. Kept mounted; `visible` toggles whether it shows.
const ModelView = ({ path, height, visible }: { path: string; height: number; visible: boolean }) => {
  const { scene } = useGLTF(path);
  const { clone, scale, offset } = useMemo(() => {
    const c = scene.clone(true);
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

export const PlayerMesh = () => {
  const form = useTransformStore((s) => s.form);
  const ov = useEditorPoliCharacterStore((s) => s.overrides['poli']);
  const carPath = ov?.modelVehiclePath || DEFAULT_CAR;
  const robotPath = ov?.modelRobotPath || DEFAULT_ROBOT;

  return (
    <>
      <Suspense fallback={form === 'car' ? <Capsule color="#f59e0b" /> : null}>
        <ModelView path={carPath} height={CAR_HEIGHT} visible={form === 'car'} />
      </Suspense>
      <Suspense fallback={form === 'robot' ? <Capsule color="#3b82f6" /> : null}>
        <ModelView path={robotPath} height={ROBOT_HEIGHT} visible={form === 'robot'} />
      </Suspense>
    </>
  );
};

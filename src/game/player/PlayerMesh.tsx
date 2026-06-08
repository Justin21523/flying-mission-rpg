import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';

// Single Poli player model (the transform/T system was removed). The model is auto-normalized:
// recentred on X/Z (so an off-centre pivot doesn't fling it into the background) with its feet at
// local y=0. Defaults to the Poli car but is overridable in Edit Mode → POLI tab (either model
// field sets the player model); falls back to a visible capsule while loading.

const DEFAULT_MODEL = '/models/characters/Poli car 3d model.glb';
const HEIGHT = 1.4;

useGLTF.preload(DEFAULT_MODEL);

const Capsule = () => (
  <mesh castShadow position={[0, 0, 0]}>
    <capsuleGeometry args={[0.45, 1.0, 8, 16]} />
    <meshStandardMaterial color="#3b82f6" roughness={0.5} metalness={0.2} />
  </mesh>
);

const ModelView = ({ path }: { path: string }) => {
  const { scene } = useGLTF(path);
  const { clone, scale, offset } = useMemo(() => {
    const c = scene.clone(true);
    const box = new Box3().setFromObject(c);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    const nativeH = Number.isFinite(size.y) && size.y > 1e-4 ? size.y : 1;
    const s = HEIGHT / nativeH;
    const ox = Number.isFinite(center.x) ? -center.x * s : 0;
    const oy = Number.isFinite(box.min.y) ? -box.min.y * s : 0;
    const oz = Number.isFinite(center.z) ? -center.z * s : 0;
    return { clone: c, scale: s, offset: [ox, oy, oz] as [number, number, number] };
  }, [scene]);
  return <primitive object={clone} scale={scale} position={offset} />;
};

export const PlayerMesh = () => {
  const ov = useEditorPoliCharacterStore((s) => s.overrides['poli']);
  const path = ov?.modelRobotPath || ov?.modelVehiclePath || DEFAULT_MODEL;
  return (
    <Suspense fallback={<Capsule />}>
      <ModelView path={path} />
    </Suspense>
  );
};

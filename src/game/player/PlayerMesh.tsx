import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import type { TransformMode } from '../../stores/transformationStore';
import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';

// Clean, crash-proof player visual.
//
// Poli is a police CAR that transforms into a ROBOT:
//   • vehicle mode (default)  → DEFAULT_CAR     ("Poli car 3d model.glb")
//   • robot   mode (press T)  → DEFAULT_ROBOT   ("Poli+transformer+3d+model.glb")
//
// BOTH models stay mounted the whole time and we just toggle `visible` — so pressing T never
// unmounts/remounts a GLB and the player can never "disappear" on transform. Each model is
// auto-normalized to a sensible height (feet at y=0) regardless of its native export scale.
// The paths default to Poli but remain overridable in Edit Mode (POLI tab) — not hardcoded-only.

const DEFAULT_CAR = '/models/characters/Poli car 3d model.glb';
const DEFAULT_ROBOT = '/models/characters/Poli+transformer+3d+model.glb';
const CAR_HEIGHT = 1.3;
const ROBOT_HEIGHT = 1.9;

// Preload both so the very first transform is instant (no flash).
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
  const { clone, scale, yOff } = useMemo(() => {
    const c = scene.clone(true);
    const box = new Box3().setFromObject(c);
    const size = new Vector3();
    box.getSize(size);
    const nativeH = Number.isFinite(size.y) && size.y > 1e-4 ? size.y : 1;
    const s = height / nativeH;
    const y = Number.isFinite(box.min.y) ? -box.min.y * s : 0;
    return { clone: c, scale: s, yOff: y };
  }, [scene, height]);
  return <primitive object={clone} scale={scale} position={[0, yOff, 0]} visible={visible} />;
};

interface Props {
  mode: TransformMode;
}

export const PlayerMesh = ({ mode }: Props) => {
  // Paths default to Poli but honour an Edit-Mode override (auto-saved in the POLI tab).
  const ov = useEditorPoliCharacterStore((s) => s.overrides['poli']);
  const carPath = ov?.modelVehiclePath || DEFAULT_CAR;
  const robotPath = ov?.modelRobotPath || DEFAULT_ROBOT;

  return (
    <>
      {/* Car (vehicle, default). Capsule fallback only while THIS model is still loading. */}
      <Suspense fallback={mode === 'vehicle' ? <Capsule color="#f59e0b" /> : null}>
        <ModelView path={carPath} height={CAR_HEIGHT} visible={mode === 'vehicle'} />
      </Suspense>
      {/* Robot (transformer, press T). */}
      <Suspense fallback={mode === 'robot' ? <Capsule color="#3b82f6" /> : null}>
        <ModelView path={robotPath} height={ROBOT_HEIGHT} visible={mode === 'robot'} />
      </Suspense>
    </>
  );
};

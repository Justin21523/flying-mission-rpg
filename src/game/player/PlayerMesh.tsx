import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import type { TransformMode } from '../../stores/transformationStore';
import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';
import { CORE_TEAM } from '../../data/characters/coreTeam';

const POLI_BASE = CORE_TEAM.find((c) => c.id === 'poli')!;
const DEFAULT_ROBOT_PATH = POLI_BASE.modelRobotPath!;
const DEFAULT_VEHICLE_PATH = POLI_BASE.modelVehiclePath!;

// Preload both forms so mode-switch has no stutter.
useGLTF.preload(DEFAULT_ROBOT_PATH);
useGLTF.preload(DEFAULT_VEHICLE_PATH);

// Capsule shown while GLBs load — same dimensions as the physics collider.
const RobotFallback = () => (
  <mesh position={[0, 0, 0]} castShadow>
    <capsuleGeometry args={[0.4, 0.9, 4, 8]} />
    <meshStandardMaterial color="#3b82f6" roughness={0.55} metalness={0.15} />
  </mesh>
);

const VehicleFallback = () => (
  <mesh position={[0, 0.1, 0]} castShadow>
    <boxGeometry args={[1.2, 0.6, 2.2]} />
    <meshStandardMaterial color="#3b82f6" roughness={0.5} />
  </mesh>
);

const RobotGlb = ({ path }: { path: string }) => {
  const { scene } = useGLTF(path);
  const clone = useMemo(() => scene.clone(), [scene]);
  // scale / position may need visual tuning.
  return <primitive object={clone} scale={1.0} position={[0, -0.9, 0]} />;
};

const VehicleGlb = ({ path }: { path: string }) => {
  const { scene } = useGLTF(path);
  const clone = useMemo(() => scene.clone(), [scene]);
  return <primitive object={clone} scale={1.0} position={[0, -0.3, 0]} />;
};

interface Props {
  mode: TransformMode;
}

export const PlayerMesh = ({ mode }: Props) => {
  // Re-read whenever the editor override for Poli changes (e.g. model path swapped in Edit Mode).
  const poliOverride = useEditorPoliCharacterStore((s) => s.overrides[POLI_BASE.id]);
  const poli = useMemo(
    () => (poliOverride ? { ...POLI_BASE, ...poliOverride } : POLI_BASE),
    [poliOverride],
  );

  const robotPath = poli.modelRobotPath ?? DEFAULT_ROBOT_PATH;
  const vehiclePath = poli.modelVehiclePath ?? DEFAULT_VEHICLE_PATH;

  if (mode === 'robot') {
    return (
      <Suspense fallback={<RobotFallback />}>
        <RobotGlb path={robotPath} />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<VehicleFallback />}>
      <VehicleGlb path={vehiclePath} />
    </Suspense>
  );
};

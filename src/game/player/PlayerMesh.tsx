import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import type { TransformMode } from '../../stores/transformationStore';
import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';
import { useNormalizedGlb } from '../poli/normalizeGlb';
import { CORE_TEAM } from '../../data/characters/coreTeam';

// Target heights so any GLB (whatever its native export units) fits the capsule collider.
const ROBOT_HEIGHT = 1.9;
const VEHICLE_HEIGHT = 1.2;

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
  // Auto-fit to ROBOT_HEIGHT; feet at local y=0, then drop 1.0 to straddle the capsule centre.
  const { scene, scale, yOffset } = useNormalizedGlb(path, ROBOT_HEIGHT);
  return <primitive object={scene} scale={scale} position={[0, yOffset - 1.0, 0]} />;
};

const VehicleGlb = ({ path }: { path: string }) => {
  const { scene, scale, yOffset } = useNormalizedGlb(path, VEHICLE_HEIGHT);
  return <primitive object={scene} scale={scale} position={[0, yOffset - 1.0, 0]} />;
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

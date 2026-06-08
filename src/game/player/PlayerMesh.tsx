import { Suspense } from 'react';
import type { TransformMode } from '../../stores/transformationStore';
import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';
import { useNormalizedGlb } from '../poli/normalizeGlb';

// Rebuilt player visual. DEFAULT = a simple, always-visible capsule (blue robot / amber vehicle)
// with a white nose cone showing the forward (+Z) direction. The model is OPTIONAL and chosen in
// Edit Mode → 🤖 POLI tab → Player: setting a Robot/Vehicle model path swaps the capsule for that
// GLB (auto-normalized so any export scale fits). No path set → capsule. This guarantees the
// player is never invisible and is fully swappable from the editor.

const ROBOT_HEIGHT = 1.9;
const VEHICLE_HEIGHT = 1.2;

const CapsulePlayer = ({ mode }: { mode: TransformMode }) => {
  const color = mode === 'vehicle' ? '#f59e0b' : '#3b82f6';
  return (
    <group>
      <mesh castShadow position={[0, 0, 0]}>
        <capsuleGeometry args={[0.45, 1.0, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Forward (+Z) indicator */}
      <mesh position={[0, 0.1, 0.62]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.18, 0.42, 12]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
};

const GlbPlayer = ({ path, targetHeight }: { path: string; targetHeight: number }) => {
  const { scene, scale, yOffset } = useNormalizedGlb(path, targetHeight);
  return <primitive object={scene} scale={scale} position={[0, yOffset - 1.0, 0]} />;
};

interface Props {
  mode: TransformMode;
}

export const PlayerMesh = ({ mode }: Props) => {
  // Only the editor override drives the model — base data stays capsule by default.
  const override = useEditorPoliCharacterStore((s) => s.overrides['poli']);
  // Use the current mode's model, but fall back to the other mode's model if only one is set,
  // so pressing T (transform) never makes a configured model disappear — it just stays until a
  // separate model is assigned to that mode in the POLI tab.
  const path = mode === 'robot'
    ? (override?.modelRobotPath ?? override?.modelVehiclePath)
    : (override?.modelVehiclePath ?? override?.modelRobotPath);
  const height = mode === 'robot' ? ROBOT_HEIGHT : VEHICLE_HEIGHT;

  if (path) {
    return (
      <Suspense fallback={<CapsulePlayer mode={mode} />}>
        <GlbPlayer path={path} targetHeight={height} />
      </Suspense>
    );
  }
  return <CapsulePlayer mode={mode} />;
};

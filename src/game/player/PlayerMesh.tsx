import { useGLTF } from '@react-three/drei';
import type { TransformMode } from '../../stores/transformationStore';

// Preload robot GLB so the first T-press has no stutter.
useGLTF.preload('/models/yokais/stylized+robot+3d+model.glb');

interface Props {
  mode: TransformMode;
}

export const PlayerMesh = ({ mode }: Props) => {
  if (mode === 'robot') return <RobotMesh />;
  return <VehicleMesh />;
};

const RobotMesh = () => {
  const { scene } = useGLTF('/models/yokais/stylized+robot+3d+model.glb');
  return <primitive object={scene} scale={0.9} position={[0, -0.4, 0]} />;
};

// Orange box placeholder — swap for POLI vehicle GLB in a later phase.
const VehicleMesh = () => (
  <mesh castShadow position={[0, 0.1, 0]}>
    <boxGeometry args={[1.2, 0.6, 2.2]} />
    <meshStandardMaterial color="#f59e0b" roughness={0.5} />
  </mesh>
);

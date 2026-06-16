import { useIncidentRuntimeStore } from '../../../stores/useIncidentRuntimeStore';

// Incident objective marker — a floating beacon at the affected-area center (Batch G §13).
export const IncidentMarkerRenderer = () => {
  const plan = useIncidentRuntimeStore((s) => s.plan);
  if (!plan) return null;
  const [x, , z] = plan.affectedArea.center;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 3, 0]} frustumCulled={false}>
        <coneGeometry args={[0.5, 1.2, 4]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 1.6, 0]} frustumCulled={false}>
        <cylinderGeometry args={[0.05, 0.05, 3, 6]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

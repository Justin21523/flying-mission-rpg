import { useIncidentRuntimeStore } from '../../../stores/useIncidentRuntimeStore';

// Edit-Mode debug gizmos for an incident (Batch G §13) — a wider wireframe ring around the affected area + a
// danger-tinted disc. Only shown when showStateChanges debug is on.
export const IncidentDebugGizmos = () => {
  const plan = useIncidentRuntimeStore((s) => s.plan);
  const show = useIncidentRuntimeStore((s) => s.runtime.debug.showStateChanges);
  const danger = useIncidentRuntimeStore((s) => s.runtime.dangerLevel);
  if (!plan || !show) return null;
  const [x, , z] = plan.affectedArea.center;
  const r = Math.max(2, plan.affectedArea.radius);
  const tint = danger >= 4 ? '#ef4444' : danger >= 3 ? '#f97316' : '#38bdf8';
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <ringGeometry args={[r + 0.5, r + 0.7, 64]} />
        <meshBasicMaterial color={tint} wireframe transparent opacity={0.6} />
      </mesh>
    </group>
  );
};

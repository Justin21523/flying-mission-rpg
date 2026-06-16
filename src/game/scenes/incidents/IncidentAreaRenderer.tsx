import { useIncidentRuntimeStore } from '../../../stores/useIncidentRuntimeStore';

// Affected-area ground ring for the active incident (Batch G §13). Visible in both Edit + Play.
export const IncidentAreaRenderer = () => {
  const plan = useIncidentRuntimeStore((s) => s.plan);
  const show = useIncidentRuntimeStore((s) => s.runtime.debug.showAffectedArea);
  if (!plan || !show) return null;
  const [x, , z] = plan.affectedArea.center;
  const r = Math.max(2, plan.affectedArea.radius);
  return (
    <mesh position={[x, 0.12, z]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
      <ringGeometry args={[r - 0.4, r, 64]} />
      <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} depthWrite={false} />
    </mesh>
  );
};

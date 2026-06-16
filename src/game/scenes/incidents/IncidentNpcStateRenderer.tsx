import { useIncidentNpcStateStore, type IncidentNpcState } from '../../../stores/useIncidentNpcStateStore';

// Renders incident rescue NPCs as colored capsules with a state tint (Batch G §13). Placeholder visuals.
const STATE_COLOR: Record<IncidentNpcState, string> = {
  idle: '#94a3b8', trapped: '#ef4444', panicked: '#f97316', injured: '#dc2626',
  'waiting-rescue': '#eab308', evacuating: '#3b82f6', safe: '#22c55e',
};

export const IncidentNpcStateRenderer = () => {
  const npcs = useIncidentNpcStateStore((s) => s.npcs);
  return (
    <>
      {Object.values(npcs).map((n) => (
        <group key={n.id} position={n.position} rotation={[0, n.facingRad ?? 0, 0]}>
          <mesh position={[0, 1, 0]} frustumCulled={false}>
            <capsuleGeometry args={[0.4, 0.8, 4, 8]} />
            <meshStandardMaterial color={STATE_COLOR[n.state]} emissive={STATE_COLOR[n.state]} emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0, 2.4, 0]} frustumCulled={false}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshBasicMaterial color={STATE_COLOR[n.state]} />
          </mesh>
        </group>
      ))}
    </>
  );
};

import { useIncidentObjectStateStore, type IncidentObjectState } from '../../../stores/useIncidentObjectStateStore';

// Renders incident virtual objects as colored crates with a state tint (Batch G §13). Placeholder visuals.
const STATE_COLOR: Record<IncidentObjectState, string> = {
  normal: '#94a3b8', damaged: '#f97316', 'blocking-path': '#eab308', burning: '#ef4444', flooded: '#3b82f6',
  broken: '#dc2626', repaired: '#22c55e', disabled: '#64748b', active: '#22c55e', cleared: '#22c55e',
};

export const IncidentObjectStateRenderer = () => {
  const objects = useIncidentObjectStateStore((s) => s.objects);
  return (
    <>
      {Object.values(objects).filter((o) => !o.id.startsWith('incident_area')).map((o) => (
        <mesh key={o.id} position={[o.position[0], 0.75, o.position[2]]} frustumCulled={false}>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial color={STATE_COLOR[o.state]} emissive={STATE_COLOR[o.state]} emissiveIntensity={0.25} transparent opacity={0.9} />
        </mesh>
      ))}
    </>
  );
};

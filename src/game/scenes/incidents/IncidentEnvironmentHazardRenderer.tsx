import { useIncidentHazardStore, type IncidentHazardKind } from '../../../stores/useIncidentHazardStore';

// Placeholder environment hazard visuals (Batch G §13) — translucent domes/rings, no real physics.
const HAZARD_COLOR: Record<IncidentHazardKind, string> = {
  smoke: '#6b7280', fire: '#ef4444', flood: '#3b82f6', electric: '#22d3ee', 'danger-zone': '#f97316', 'route-block': '#dc2626', 'route-open': '#22c55e',
};

export const IncidentEnvironmentHazardRenderer = () => {
  const hazards = useIncidentHazardStore((s) => s.hazards);
  return (
    <>
      {Object.values(hazards).filter((h) => h.active).map((h) => {
        const c = HAZARD_COLOR[h.kind];
        if (h.kind === 'danger-zone' || h.kind === 'route-block' || h.kind === 'route-open') {
          return (
            <mesh key={h.id} position={[h.center[0], 0.14, h.center[2]]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
              <ringGeometry args={[Math.max(1, h.radius - 0.6), h.radius, 48]} />
              <meshBasicMaterial color={c} transparent opacity={0.45} depthWrite={false} />
            </mesh>
          );
        }
        return (
          <mesh key={h.id} position={[h.center[0], 1.2, h.center[2]]} frustumCulled={false}>
            <sphereGeometry args={[Math.max(1.2, h.radius * 0.4), 12, 12]} />
            <meshBasicMaterial color={c} transparent opacity={0.28} depthWrite={false} />
          </mesh>
        );
      })}
    </>
  );
};

import { Text } from '@react-three/drei';
import { useIncidentScenarioStore, type SpawnedEntity } from '../../stores/incidentScenarioStore';

// POLI (Phase F) — visuals for active traffic-incident scenarios in this area: a stalled vehicle / cargo / cone
// per spawned entity + a scene marker. Subscribes to the runtime scenario store; collision registration +
// road-blocking happen in runIncidentAction. Sibling layer in AreaRenderer (kit seam #1).
const NO_RAYCAST = () => null;

const EntityVisual = ({ e }: { e: SpawnedEntity }) => {
  if (e.kind === 'vehicle') {
    return (
      <group position={e.position}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[1.8, 1.2, 3.4]} />
          <meshStandardMaterial color={e.color} roughness={0.5} metalness={0.3} />
        </mesh>
        {e.state && e.state !== 'normal' && (
          <Text position={[0, 1.8, 0]} fontSize={0.3} color="#fbbf24" anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#000" raycast={NO_RAYCAST}>{`⚠ ${e.state}`}</Text>
        )}
      </group>
    );
  }
  // obstacle / hazard → a cone
  return (
    <mesh position={[e.position[0], e.position[1] + 0.4, e.position[2]]} castShadow>
      <coneGeometry args={[0.5, 0.9, 12]} />
      <meshStandardMaterial color={e.color} roughness={0.7} />
    </mesh>
  );
};

export const TrafficIncidentLayer = ({ areaId }: { areaId: string }) => {
  const instances = useIncidentScenarioStore((s) => s.instances).filter((x) => x.areaId === areaId);
  if (instances.length === 0) return null;
  return (
    <>
      {instances.map((inst) => (
        <group key={inst.instanceId}>
          {inst.entities.map((e) => <EntityVisual key={e.id} e={e} />)}
          <Text position={[inst.position[0], inst.position[1] + 2.6, inst.position[2]]} fontSize={0.4} color="#fca5a5" anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="#000" raycast={NO_RAYCAST}>
            {`🚧 ${inst.name}`}
          </Text>
        </group>
      ))}
    </>
  );
};

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Group } from 'three';
import { useTrafficStore } from '../../stores/trafficStore';
import { POLI_VEHICLES } from '../../data/traffic/broomsTownVehicles';
import { TRAFFIC_SIGNALS } from '../../data/traffic/broomsTownSignals';
import { POLI_ROADS } from '../../data/traffic/broomsTownRoads';
import { getPathPosition, getPathHeading } from '../../types/traffic';
import type { VehicleDefinition, TrafficSignalDef, TrafficPhase } from '../../types/traffic';

// Signal light layout: red top, yellow middle, green bottom.
const SIGNAL_LIGHTS: { y: number; color: string; phase: TrafficPhase }[] = [
  { y: 3.55, color: '#ef4444', phase: 'red' },
  { y: 3.30, color: '#fbbf24', phase: 'yellow' },
  { y: 3.05, color: '#22c55e', phase: 'green' },
];

// ---- Vehicle mesh ----------------------------------------------------------
interface VehicleMeshProps {
  def: VehicleDefinition;
}

const VehicleMesh = ({ def }: VehicleMeshProps) => {
  const groupRef = useRef<Group>(null);
  const path = useMemo(() => POLI_ROADS.find((r) => r.id === def.pathId), [def.pathId]);

  // Wheel offsets computed once from bodySize.
  const wheelOffsets = useMemo<[number, number, number][]>(() => {
    const [w, , l] = def.bodySize;
    return [
      [ w / 2 + 0.05, 0.3,  l / 2 - 0.4],
      [-w / 2 - 0.05, 0.3,  l / 2 - 0.4],
      [ w / 2 + 0.05, 0.3, -l / 2 + 0.4],
      [-w / 2 - 0.05, 0.3, -l / 2 + 0.4],
    ];
  }, [def.bodySize]);

  // Update position + heading directly via ref to avoid React re-renders every frame.
  useFrame(() => {
    if (!groupRef.current || !path) return;
    const progress = useTrafficStore.getState().vehicleProgress[def.id] ?? 0;
    const [x, y, z] = getPathPosition(path, progress);
    const heading = getPathHeading(path, progress);
    groupRef.current.position.set(x, y, z);
    groupRef.current.rotation.y = heading;
  });

  return (
    <group ref={groupRef}>
      {/* Vehicle body */}
      <mesh position={[0, def.bodySize[1] / 2, 0]} castShadow>
        <boxGeometry args={def.bodySize} />
        <meshStandardMaterial color={def.color} roughness={0.45} metalness={0.3} />
      </mesh>
      {/* Windshield tint */}
      <mesh position={[0, def.bodySize[1] * 0.75, def.bodySize[2] * 0.28]}>
        <boxGeometry args={[def.bodySize[0] * 0.8, def.bodySize[1] * 0.45, 0.05]} />
        <meshStandardMaterial color="#88ccff" transparent opacity={0.6} roughness={0.1} />
      </mesh>
      {/* Wheels */}
      {wheelOffsets.map((off, i) => (
        <mesh key={i} position={off} rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 0.22, 10]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      ))}
      {/* Floating name label */}
      <Text
        position={[0, def.bodySize[1] + 0.75, 0]}
        fontSize={0.28}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
        renderOrder={1}
      >
        {def.nameZhTW}
      </Text>
    </group>
  );
};

// ---- Traffic signal mesh ---------------------------------------------------
interface TrafficSignalMeshProps {
  def: TrafficSignalDef;
}

const TrafficSignalMesh = ({ def }: TrafficSignalMeshProps) => {
  // Subscribe only to this signal's phase — re-renders every ~8–10 seconds, not every frame.
  const phase = useTrafficStore((s) => s.signalPhases[def.id] ?? 'green');

  return (
    <group position={def.position}>
      {/* Pole */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 3.0, 8]} />
        <meshStandardMaterial color="#555555" roughness={0.8} />
      </mesh>
      {/* Housing box */}
      <mesh position={[0, 3.3, 0.15]}>
        <boxGeometry args={[0.38, 1.1, 0.28]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </mesh>
      {/* Three signal lights */}
      {SIGNAL_LIGHTS.map(({ y, color, phase: lightPhase }) => (
        <mesh key={lightPhase} position={[0, y, 0.28]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={phase === lightPhase ? 1.2 : 0.04}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
};

// ---- Layer -----------------------------------------------------------------
interface TrafficLayerProps {
  areaId: string;
}

export const TrafficLayer = ({ areaId }: TrafficLayerProps) => {
  const vehicles = useMemo(() => POLI_VEHICLES.filter((v) => v.areaId === areaId), [areaId]);
  const signals = useMemo(() => TRAFFIC_SIGNALS.filter((s) => s.areaId === areaId), [areaId]);

  // Advance the traffic simulation each frame (called once, not per vehicle).
  useFrame((_, delta) => {
    useTrafficStore.getState().tick(delta);
  });

  return (
    <>
      {vehicles.map((v) => (
        <VehicleMesh key={v.id} def={v} />
      ))}
      {signals.map((s) => (
        <TrafficSignalMesh key={s.id} def={s} />
      ))}
    </>
  );
};

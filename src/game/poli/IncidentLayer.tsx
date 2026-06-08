import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Vector3 } from 'three';
import type { Mesh } from 'three';
import { useFlagStore } from '../../stores/flagStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useRescueOperationStore } from '../../stores/rescueOperationStore';
import { POLI_INCIDENTS } from '../../data/incidents/broomsTownIncidents';
import type { IncidentDefinition } from '../../types/incident';

// Interaction radius for triggering a rescue and detecting waypoints.
const RESCUE_TRIGGER_RADIUS = 4.0;
const WAYPOINT_COLLECT_RADIUS = 2.5;

// Module-level vectors — no per-frame allocation.
const _playerPos = new Vector3();
const _markerPos = new Vector3();
const _waypointPos = new Vector3();

const INCIDENT_COLORS: Record<string, string> = {
  fire: '#ff6633',
  lost_person: '#3399ff',
  road_hazard: '#ffcc00',
};

// ---- E-key hook ----------------------------------------------------------
// Handles two cases:
//   1. No active rescue + player near an incident marker → startRescue
//   2. Active rescue in on_scene + action stage → pressAction
function useIncidentInteraction(areaId: string) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' || e.repeat) return;
      const rescue = useRescueOperationStore.getState();

      // Case 2: action press during active rescue
      if (rescue.isActive && rescue.step === 'on_scene' && rescue.incidentId) {
        const def = POLI_INCIDENTS.find((d) => d.id === rescue.incidentId);
        const stage = def?.stages[rescue.stageIndex];
        if (stage?.type === 'action') {
          rescue.pressAction();
          return;
        }
      }

      // Case 1: start a new rescue
      if (rescue.isActive) return;
      const playerPos = usePlayerStore.getState().position;
      if (!playerPos) return;
      _playerPos.set(playerPos.x, playerPos.y, playerPos.z);

      const activeIncidents = POLI_INCIDENTS.filter(
        (d) =>
          d.spawnAreaId === areaId &&
          !useFlagStore.getState().hasFlag(`incident_resolved_${d.id}`),
      );
      for (const def of activeIncidents) {
        _markerPos.set(...def.markerPosition);
        if (_playerPos.distanceTo(_markerPos) <= RESCUE_TRIGGER_RADIUS) {
          rescue.startRescue(def.id);
          return;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [areaId]);
}

// ---- Pulsing incident marker -----------------------------------------------
interface IncidentMarkerProps {
  def: IncidentDefinition;
}

const IncidentMarker = ({ def }: IncidentMarkerProps) => {
  const meshRef = useRef<Mesh>(null);
  const pulseRef = useRef(0);
  const color = INCIDENT_COLORS[def.type] ?? '#ffffff';

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    pulseRef.current += delta * 2.5;
    const intensity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(pulseRef.current));
    (meshRef.current.material as unknown as { emissiveIntensity: number }).emissiveIntensity = intensity;
  });

  return (
    <group position={def.markerPosition}>
      <mesh ref={meshRef} position={[0, 0.8, 0]} castShadow>
        <sphereGeometry args={[0.55, 16, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      <Text
        position={[0, 2.0, 0]}
        fontSize={0.35}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.06}
        outlineColor="#000000"
        renderOrder={1}
      >
        {def.titleZhTW}
      </Text>
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.22}
        color="#ffeecc"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#000000"
        renderOrder={1}
      >
        [E] 開始救援
      </Text>
    </group>
  );
};

// ---- Waypoint orb ----------------------------------------------------------
interface WaypointOrbProps {
  position: [number, number, number];
  found: boolean;
}

const WaypointOrb = ({ position, found }: WaypointOrbProps) => {
  if (found) return null;
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.35, 12, 8]} />
      <meshStandardMaterial
        color="#ffee44"
        emissive="#ffcc00"
        emissiveIntensity={0.6}
        roughness={0.3}
        metalness={0.2}
      />
    </mesh>
  );
};

// ---- Waypoint proximity tracker (runs in useFrame for the active rescue) ---
const WaypointTracker = () => {
  useFrame(() => {
    const rescue = useRescueOperationStore.getState();
    if (!rescue.isActive || rescue.step !== 'on_scene' || !rescue.incidentId) return;
    const def = POLI_INCIDENTS.find((d) => d.id === rescue.incidentId);
    const stage = def?.stages[rescue.stageIndex];
    if (!stage || stage.type !== 'waypoints' || !stage.waypointPositions) return;

    const playerPos = usePlayerStore.getState().position;
    if (!playerPos) return;
    _playerPos.set(playerPos.x, playerPos.y, playerPos.z);

    stage.waypointPositions.forEach((wp, idx) => {
      if (rescue.waypointsFound[idx]) return;
      _waypointPos.set(...wp);
      if (_playerPos.distanceTo(_waypointPos) <= WAYPOINT_COLLECT_RADIUS) {
        rescue.markWaypoint(idx);
      }
    });
  });
  return null;
};

// ---- Rescue tick (useFrame proxy for the store) ----------------------------
const RescueTicker = () => {
  useFrame((_, delta) => {
    useRescueOperationStore.getState().tick(delta);
  });
  return null;
};

// ---- Main layer ------------------------------------------------------------
interface IncidentLayerProps {
  areaId: string;
}

export const IncidentLayer = ({ areaId }: IncidentLayerProps) => {
  // Re-render when flags change so resolved markers disappear.
  const flags = useFlagStore((s) => s.flags);
  const activeIncidents = POLI_INCIDENTS.filter(
    (d) =>
      d.spawnAreaId === areaId &&
      !flags[`incident_resolved_${d.id}`],
  );

  const rescue = useRescueOperationStore();
  const activeStage =
    rescue.isActive && rescue.incidentId
      ? POLI_INCIDENTS.find((d) => d.id === rescue.incidentId)?.stages[rescue.stageIndex]
      : null;

  useIncidentInteraction(areaId);

  return (
    <>
      <RescueTicker />
      {activeIncidents.map((def) => (
        <IncidentMarker key={def.id} def={def} />
      ))}
      {/* Waypoint orbs rendered only during an active waypoints-stage rescue in this area */}
      {rescue.isActive &&
        rescue.step === 'on_scene' &&
        activeStage?.type === 'waypoints' &&
        rescue.incidentId &&
        POLI_INCIDENTS.find((d) => d.id === rescue.incidentId)?.spawnAreaId === areaId &&
        activeStage.waypointPositions?.map((pos, idx) => (
          <WaypointOrb key={idx} position={pos} found={rescue.waypointsFound[idx] ?? false} />
        ))}
      <WaypointTracker />
    </>
  );
};

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Vector3 } from 'three';
import type { Mesh } from 'three';
import { useFlagStore } from '../../stores/flagStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useRescueOperationStore } from '../../stores/rescueOperationStore';
import { useIncidentStore } from '../../stores/incidentStore';
import { getEditorIncident, getEditorIncidents } from '../../stores/editorIncidentStore';
import type { IncidentDefinition } from '../../types/incident';

// Renders the incidents the IncidentDirector has SPAWNED in this area (random occurrence), using the
// editable incident definitions. Marker position is authored in the 🚨 Incidents tab (canonical) so
// there's no separate gizmo override. Rescue pipeline ([E]) + waypoints unchanged.

const RESCUE_TRIGGER_RADIUS = 4.0;
const _playerPos = new Vector3();
const _markerPos = new Vector3();
const _waypointPos = new Vector3();

const INCIDENT_COLORS: Record<string, string> = {
  fire: '#ff6633',
  lost_person: '#3399ff',
  road_hazard: '#ffcc00',
};

// ---- E-key hook ----------------------------------------------------------
function useIncidentInteraction(areaId: string) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' || e.repeat) return;
      const rescue = useRescueOperationStore.getState();

      if (rescue.isActive && rescue.step === 'on_scene' && rescue.incidentId) {
        const def = getEditorIncident(rescue.incidentId);
        const stage = def?.stages[rescue.stageIndex];
        if (stage?.type === 'action') { rescue.pressAction(); return; }
      }

      if (rescue.isActive) return;
      const playerPos = usePlayerStore.getState().position;
      if (!playerPos) return;
      _playerPos.set(playerPos.x, playerPos.y, playerPos.z);

      for (const def of useIncidentStore.getState().getActiveForArea(areaId)) {
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
const IncidentMarker = ({ def }: { def: IncidentDefinition }) => {
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
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.4} metalness={0.3} />
      </mesh>
      <Text position={[0, 2.0, 0]} fontSize={0.35} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.06} outlineColor="#000000" renderOrder={1}>
        {def.title}
      </Text>
      <Text position={[0, 1.5, 0]} fontSize={0.22} color="#ffeecc" anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="#000000" renderOrder={1}>
        [E] Start Rescue
      </Text>
    </group>
  );
};

// ---- Waypoint orb ----------------------------------------------------------
const WaypointOrb = ({ position, found }: { position: [number, number, number]; found: boolean }) => {
  if (found) return null;
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.35, 12, 8]} />
      <meshStandardMaterial color="#ffee44" emissive="#ffcc00" emissiveIntensity={0.6} roughness={0.3} metalness={0.2} />
    </mesh>
  );
};

const WaypointTracker = () => {
  useFrame(() => {
    const rescue = useRescueOperationStore.getState();
    if (!rescue.isActive || rescue.step !== 'on_scene' || !rescue.incidentId) return;
    const def = getEditorIncident(rescue.incidentId);
    const stage = def?.stages[rescue.stageIndex];
    if (!stage || stage.type !== 'waypoints' || !stage.waypointPositions) return;

    const playerPos = usePlayerStore.getState().position;
    if (!playerPos) return;
    _playerPos.set(playerPos.x, playerPos.y, playerPos.z);
    const radius = rescue.getWaypointRadius();

    stage.waypointPositions.forEach((wp, idx) => {
      if (rescue.waypointsFound[idx]) return;
      _waypointPos.set(...wp);
      if (_playerPos.distanceTo(_waypointPos) <= radius) rescue.markWaypoint(idx);
    });
  });
  return null;
};

const RescueTicker = () => {
  useFrame((_, delta) => { useRescueOperationStore.getState().tick(delta); });
  return null;
};

// ---- Main layer ------------------------------------------------------------
export const IncidentLayer = ({ areaId }: { areaId: string }) => {
  const activeIds = useIncidentStore((s) => s.activeIds);
  const flags = useFlagStore((s) => s.flags);
  const activeIncidents = getEditorIncidents().filter(
    (d) => activeIds.includes(d.id) && d.spawnAreaId === areaId && !flags[`incident_resolved_${d.id}`],
  );

  const rescue = useRescueOperationStore();
  const activeStage = rescue.isActive && rescue.incidentId
    ? getEditorIncident(rescue.incidentId)?.stages[rescue.stageIndex]
    : null;

  useIncidentInteraction(areaId);

  return (
    <>
      <RescueTicker />
      {activeIncidents.map((def) => <IncidentMarker key={def.id} def={def} />)}
      {rescue.isActive && rescue.step === 'on_scene' && activeStage?.type === 'waypoints'
        && rescue.incidentId && getEditorIncident(rescue.incidentId)?.spawnAreaId === areaId
        && activeStage.waypointPositions?.map((pos, idx) => (
          <WaypointOrb key={idx} position={pos} found={rescue.waypointsFound[idx] ?? false} />
        ))}
      <WaypointTracker />
    </>
  );
};

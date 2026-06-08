import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Vector3 } from 'three';
import type { Mesh } from 'three';
import { useFlagStore } from '../../stores/flagStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useRescueOperationStore } from '../../stores/rescueOperationStore';
import { useUiStore } from '../../stores/uiStore';
import { useMergedTransform, useSceneEditStore } from '../../stores/sceneEditStore';
import { objKey } from '../edit/sceneEditMerge';
import type { BaseTransform } from '../edit/sceneEditMerge';
import { EditableObject } from '../edit/EditableObject';
import { POLI_INCIDENTS } from '../../data/incidents/broomsTownIncidents';
import type { IncidentDefinition } from '../../types/incident';

// Effective marker position = authored markerPosition ⊕ any kit scene-edit override.
// Reads the live override store directly so the E-key trigger uses the moved location too.
function effectiveMarkerPosition(areaId: string, def: IncidentDefinition): [number, number, number] {
  const key = objKey(areaId, 'trigger', def.id);
  const ov = useSceneEditStore.getState().overrides[key]?.position;
  return ov ?? def.markerPosition;
}

// Radius for triggering a rescue (E-key near marker).
const RESCUE_TRIGGER_RADIUS = 4.0;

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
function useIncidentInteraction(areaId: string) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' || e.repeat) return;
      const rescue = useRescueOperationStore.getState();

      // Action press during active rescue
      if (rescue.isActive && rescue.step === 'on_scene' && rescue.incidentId) {
        const def = POLI_INCIDENTS.find((d) => d.id === rescue.incidentId);
        const stage = def?.stages[rescue.stageIndex];
        if (stage?.type === 'action') {
          rescue.pressAction();
          return;
        }
      }

      // Start a new rescue when near a marker
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
        _markerPos.set(...effectiveMarkerPosition(areaId, def));
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
// Edit Mode: a kit EditableObject (click → centred gizmo + transform inspector, drag/edit
// auto-saves to sceneEditStore and applies in play). Play Mode: pulsing marker at the merged
// (authored ⊕ edited) position. Same Edit Mode pipeline as every other world object.
interface IncidentMarkerProps {
  def: IncidentDefinition;
  areaId: string;
}

const IncidentMarkerVisual = ({ def }: { def: IncidentDefinition }) => {
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
    <>
      <mesh ref={meshRef} position={[0, 0.8, 0]} castShadow>
        <sphereGeometry args={[0.55, 16, 12]} />
        <meshStandardMaterial
          color={color} emissive={color} emissiveIntensity={0.5}
          roughness={0.4} metalness={0.3}
        />
      </mesh>
      <Text
        position={[0, 2.0, 0]} fontSize={0.35} color="#ffffff"
        anchorX="center" anchorY="middle" outlineWidth={0.06} outlineColor="#000000" renderOrder={1}
      >
        {def.title}
      </Text>
      <Text
        position={[0, 1.5, 0]} fontSize={0.22} color="#ffeecc"
        anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="#000000" renderOrder={1}
      >
        [E] Start Rescue
      </Text>
    </>
  );
};

const IncidentMarker = ({ def, areaId }: IncidentMarkerProps) => {
  const editMode = useUiStore((s) => s.editMode);
  const key = objKey(areaId, 'trigger', def.id);
  const base: BaseTransform = { position: def.markerPosition, rotation: [0, 0, 0], scale: 1 };
  const m = useMergedTransform(key, base);

  if (editMode) {
    return <EditableObject objKey={key} base={base}><IncidentMarkerVisual def={def} /></EditableObject>;
  }
  return (
    <group position={m.position} rotation={m.rotation} scale={m.scale}>
      <IncidentMarkerVisual def={def} />
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
        color="#ffee44" emissive="#ffcc00" emissiveIntensity={0.6}
        roughness={0.3} metalness={0.2}
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

    // Dynamic radius from toolBonus (rescue_rope / signal_scanner equipped).
    const radius = rescue.getWaypointRadius();

    stage.waypointPositions.forEach((wp, idx) => {
      if (rescue.waypointsFound[idx]) return;
      _waypointPos.set(...wp);
      if (_playerPos.distanceTo(_waypointPos) <= radius) {
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
  const flags = useFlagStore((s) => s.flags);
  const activeIncidents = POLI_INCIDENTS.filter(
    (d) => d.spawnAreaId === areaId && !flags[`incident_resolved_${d.id}`],
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
        <IncidentMarker key={def.id} def={def} areaId={areaId} />
      ))}
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

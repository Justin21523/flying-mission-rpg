import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { RigidBody, CapsuleCollider, type RapierRigidBody } from '@react-three/rapier';
import type { Group } from 'three';
import { useTrafficStore } from '../../stores/trafficStore';
import { useUiStore } from '../../stores/uiStore';
import { useMergedTransform } from '../../stores/sceneEditStore';
import { objKey } from '../edit/sceneEditMerge';
import type { BaseTransform } from '../edit/sceneEditMerge';
import { EditableObject } from '../edit/EditableObject';
import { DataBackedPlacement } from '../edit/DataBackedPlacement';
import { useEditorTrafficStore, getEditorRoadPath, type EditorRoad } from '../../stores/editorTrafficStore';
import { getPathPosition, getPathHeading, computeRoadPath } from '../../types/traffic';
import type { VehicleDefinition, TrafficSignalDef, TrafficPhase, Crosswalk } from '../../types/traffic';

// Tiles a road-surface model along the path + roadside decor offset to the side. Sampled once (memoised).
const RoadModels = ({ road }: { road: EditorRoad }) => {
  // Build the path from the road's own waypoints so the memo re-samples live when a node is dragged.
  const items = useMemo(() => {
    const path = computeRoadPath(road.id, road.areaId, road.waypoints);
    if (!path || path.totalLength === 0) return [];
    const out: { key: string; model: string; pos: [number, number, number]; rot: number; scale: number }[] = [];
    const sample = (model: string | undefined, spacing: number, scale: number, offset: number, tag: string) => {
      if (!model || spacing <= 0) return;
      const n = Math.max(1, Math.floor(path.totalLength / spacing));
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const [x, y, z] = getPathPosition(path, t);
        const h = getPathHeading(path, t);
        const ox = Math.cos(h) * offset; // perpendicular offset to the side
        const oz = -Math.sin(h) * offset;
        out.push({ key: `${tag}${i}`, model, pos: [x + ox, y - 0.4, z + oz], rot: h, scale });
      }
    };
    sample(road.surfaceModelAssetId, road.surfaceSpacing ?? 6, road.surfaceScale ?? 4, 0, 's');
    sample(road.decorModelAssetId, road.decorSpacing ?? 12, 3, road.decorOffset ?? 4, 'd');
    return out;
  }, [road.id, road.areaId, road.waypoints, road.surfaceModelAssetId, road.surfaceSpacing, road.surfaceScale, road.decorModelAssetId, road.decorSpacing, road.decorOffset]);

  if (items.length === 0) return null;
  return (
    <>
      {items.map((it) => (
        <group key={it.key} position={it.pos} rotation={[0, it.rot, 0]}>
          <NormalizedGlbModel assetId={it.model} target={it.scale} />
        </group>
      ))}
    </>
  );
};
import { NormalizedGlbModel } from '../world/NormalizedGlbModel';

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

const VehicleBody = ({ def, wheelOffsets }: { def: VehicleDefinition; wheelOffsets: [number, number, number][] }) => (
  <>
    {def.modelAssetId ? (
        <NormalizedGlbModel assetId={def.modelAssetId} target={def.modelScale ?? 2.4} />
      ) : (
        <>
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
        </>
      )}
  </>
);

const VehicleMesh = ({ def }: VehicleMeshProps) => {
  const count = Math.max(1, def.count ?? 1);
  const refs = useRef<(Group | null)[]>([]);
  const wheelOffsets = useMemo<[number, number, number][]>(() => {
    const [w, , l] = def.bodySize;
    return [
      [w / 2 + 0.05, 0.3, l / 2 - 0.4],
      [-w / 2 - 0.05, 0.3, l / 2 - 0.4],
      [w / 2 + 0.05, 0.3, -l / 2 + 0.4],
      [-w / 2 - 0.05, 0.3, -l / 2 + 0.4],
    ];
  }, [def.bodySize]);

  // All copies share one progress value but sit evenly spaced around the loop, circulating together.
  useFrame(() => {
    const path = getEditorRoadPath(def.pathId);
    if (!path) return;
    const base = useTrafficStore.getState().vehicleProgress[def.id] ?? 0;
    for (let i = 0; i < count; i++) {
      const g = refs.current[i];
      if (!g) continue;
      const prog = (base + i / count) % 1;
      const [x, y, z] = getPathPosition(path, prog);
      g.position.set(x, y, z);
      g.rotation.y = getPathHeading(path, prog);
    }
  });

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }}>
          <VehicleBody def={def} wheelOffsets={wheelOffsets} />
          {i === 0 && (
            <Text position={[0, def.bodySize[1] + 0.75, 0]} fontSize={0.28} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="#000000" renderOrder={1}>
              {def.name}
            </Text>
          )}
        </group>
      ))}
    </>
  );
};

// ---- Traffic signal mesh ---------------------------------------------------
interface TrafficSignalMeshProps {
  def: TrafficSignalDef;
}

const TrafficSignalVisual = ({ def }: TrafficSignalMeshProps) => {
  // Subscribe only to this signal's phase — re-renders every ~8–10 seconds, not every frame.
  const phase = useTrafficStore((s) => s.signalPhases[def.id] ?? 'green');

  return (
    <>
      {def.modelAssetId ? (
        <NormalizedGlbModel assetId={def.modelAssetId} target={def.modelScale ?? 4} />
      ) : (
        <>
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
        </>
      )}
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
    </>
  );
};

// Edit Mode: kit EditableObject (click → centred gizmo + inspector, auto-save + play-sync).
// Play Mode: at the merged (authored ⊕ edited) position.
const TrafficSignalMesh = ({ def, areaId }: TrafficSignalMeshProps & { areaId: string }) => {
  const editMode = useUiStore((s) => s.editMode);
  const key = objKey(areaId, 'trigger', def.id);
  const base: BaseTransform = { position: def.position, rotation: [0, 0, 0], scale: 1 };
  const m = useMergedTransform(key, base);

  if (editMode) {
    return <EditableObject objKey={key} base={base}><TrafficSignalVisual def={def} /></EditableObject>;
  }
  return (
    <group position={m.position} rotation={m.rotation} scale={m.scale}>
      <TrafficSignalVisual def={def} />
    </group>
  );
};

// ---- Pedestrian crossing ---------------------------------------------------
// Zebra stripes + a walker that crosses while the linked signal is RED (cars stopped) and waits otherwise.
// The walker rides a kinematic capsule body so the player collides with it.
const CrosswalkEntity = ({ def }: { def: Crosswalk }) => {
  const editMode = useUiStore((s) => s.editMode);
  // Stripes drawn at LOCAL offsets (relative to the crossing centre) so a parent group can place them.
  const stripes = useMemo(() => {
    const out: { key: number; pos: [number, number, number]; size: [number, number] }[] = [];
    const n = 5;
    for (let i = 0; i < n; i++) {
      const o = (i / (n - 1) - 0.5) * def.length;
      const pos: [number, number, number] = def.axis === 'x' ? [o, 0.02, 0] : [0, 0.02, o];
      out.push({ key: i, pos, size: def.axis === 'x' ? [0.3, 2.6] : [2.6, 0.3] });
    }
    return out;
  }, [def.length, def.axis]);

  const stripeMeshes = stripes.map((s) => (
    <mesh key={s.key} position={s.pos} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={s.size} />
      <meshStandardMaterial color="#f8fafc" roughness={0.9} />
    </mesh>
  ));

  // Edit Mode: gizmo-movable (writes back to the crosswalk position); no pedestrian while editing.
  if (editMode) {
    return (
      <DataBackedPlacement
        objKey={objKey(def.areaId, 'trigger', def.id)}
        position={def.position}
        color="#f8fafc"
        onMove={(pos) => useEditorTrafficStore.getState().updateCrosswalk(def.id, { position: pos })}
        onDelete={() => useEditorTrafficStore.getState().removeCrosswalk(def.id)}
      >
        {stripeMeshes}
      </DataBackedPlacement>
    );
  }
  return (
    <>
      <group position={def.position}>{stripeMeshes}</group>
      <Pedestrian def={def} />
    </>
  );
};

const Pedestrian = ({ def }: { def: Crosswalk }) => {
  const body = useRef<RapierRigidBody>(null);
  const tRef = useRef(0);   // -1..1 across the crossing
  const dirRef = useRef(1);

  useFrame((_, dtRaw) => {
    if (!body.current) return;
    const dt = Math.min(dtRaw, 0.05);
    // Cross only when it's safe: the linked signal is red (cars stopped), or there's no linked signal.
    const cross = def.linkedSignalId ? useTrafficStore.getState().getSignalPhase(def.linkedSignalId) === 'red' : true;
    if (cross) {
      const half = Math.max(0.5, def.length / 2);
      tRef.current += (dirRef.current * (def.pedSpeed ?? 1.2) * dt) / half;
      if (tRef.current > 1) { tRef.current = 1; dirRef.current = -1; }
      else if (tRef.current < -1) { tRef.current = -1; dirRef.current = 1; }
    }
    const off = tRef.current * (def.length / 2);
    const x = def.position[0] + (def.axis === 'x' ? off : 0);
    const z = def.position[2] + (def.axis === 'z' ? off : 0);
    body.current.setNextKinematicTranslation({ x, y: def.position[1], z });
  });

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={def.position}>
      <CapsuleCollider args={[0.35, 0.3]} position={[0, 0.65, 0]} />
      {def.pedModelAssetId ? (
        <NormalizedGlbModel assetId={def.pedModelAssetId} target={1.6} />
      ) : (
        <mesh position={[0, 0.65, 0]} castShadow>
          <capsuleGeometry args={[0.28, 0.6, 4, 8]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.6} />
        </mesh>
      )}
    </RigidBody>
  );
};

// ---- Layer -----------------------------------------------------------------
interface TrafficLayerProps {
  areaId: string;
}

export const TrafficLayer = ({ areaId }: TrafficLayerProps) => {
  const vehicles = useEditorTrafficStore((s) => s.vehicles).filter((v) => v.areaId === areaId);
  const signals = useEditorTrafficStore((s) => s.signals).filter((s) => s.areaId === areaId);
  const crosswalks = useEditorTrafficStore((s) => s.crosswalks).filter((c) => c.areaId === areaId);
  const roads = useEditorTrafficStore((s) => s.roads).filter((r) => r.areaId === areaId);

  // Advance the traffic simulation each frame (called once, not per vehicle).
  useFrame((_, delta) => {
    useTrafficStore.getState().tick(delta);
  });

  return (
    <>
      {roads.map((r) => (
        <RoadModels key={`rm-${r.id}`} road={r} />
      ))}
      {vehicles.map((v) => (
        <VehicleMesh key={v.id} def={v} />
      ))}
      {signals.map((s) => (
        <TrafficSignalMesh key={s.id} def={s} areaId={areaId} />
      ))}
      {crosswalks.map((c) => (
        <CrosswalkEntity key={c.id} def={c} />
      ))}
    </>
  );
};

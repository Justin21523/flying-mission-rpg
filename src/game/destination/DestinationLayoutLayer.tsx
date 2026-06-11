import { RigidBody } from '@react-three/rapier';
import { useUiStore } from '../../stores/uiStore';
import { useEditorDestinationStore } from '../../stores/game/editorDestinationStore';
import { useDestinationRuntimeStore } from '../../stores/game/destinationRuntimeStore';
import { getModelAsset } from '../../data/modelLibrary';
import { NormalizedGlbModel } from '../world/NormalizedGlbModel';
import { EditableObject } from '../edit/EditableObject';
import { useMergedTransform, useIsDeleted } from '../../stores/sceneEditStore';
import { destinationPartKey } from './destinationPartKey';
import type { DestinationPart } from '../../types/game/destination';

// Renders the editable destination layout with the POLI gizmo pipeline (EDIT: EditableObject + shared
// gizmo; PLAY: merged transform; buildings get fixed colliders so the robot can't pass through). Mission
// objects that were collected are hidden; the carried item is drawn attached to the robot by the director.

const ZoneDisc = ({ radius, color, y = 0.04 }: { radius: number; color: string; y?: number }) => (
  <group position={[0, y, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius, 40]} />
      <meshStandardMaterial color={color} transparent opacity={0.3} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.25, radius, 40]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
    </mesh>
  </group>
);

const PartVisual = ({ part }: { part: DestinationPart }) => {
  if (part.assetId && getModelAsset(part.assetId)) {
    return <NormalizedGlbModel assetId={part.assetId} target={part.modelTarget && part.modelTarget > 0 ? part.modelTarget : undefined} />;
  }
  switch (part.kind) {
    case 'building':
      return (
        <mesh position={[0, part.size[1] / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={part.size} />
          <meshStandardMaterial color={part.color} roughness={0.8} />
        </mesh>
      );
    case 'road':
      return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
          <planeGeometry args={[part.size[0], part.size[2]]} />
          <meshStandardMaterial color={part.color} roughness={1} />
        </mesh>
      );
    case 'landing_zone':
    case 'safe_zone':
    case 'dropoff_zone':
      return <ZoneDisc radius={part.radius ?? Math.max(part.size[0], part.size[2]) / 2} color={part.color} />;
    case 'carry_item':
      return (
        <mesh position={[0, part.size[1] / 2, 0]} castShadow>
          <boxGeometry args={part.size} />
          <meshStandardMaterial color={part.color} emissive={part.color} emissiveIntensity={0.5} />
        </mesh>
      );
    case 'lost_item':
      return (
        <mesh position={[0, 0.4, 0]} castShadow>
          <octahedronGeometry args={[Math.max(0.4, part.size[0] / 2), 0]} />
          <meshStandardMaterial color={part.color} emissive={part.color} emissiveIntensity={0.7} />
        </mesh>
      );
    case 'repair_device':
      return (
        <group>
          <mesh position={[0, part.size[1] / 2, 0]} castShadow>
            <cylinderGeometry args={[part.size[0] / 2, part.size[0] / 2, part.size[1], 12]} />
            <meshStandardMaterial color={part.color} metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, part.size[1] + 0.3, 0]}>
            <sphereGeometry args={[0.3, 10, 10]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.4} />
          </mesh>
        </group>
      );
    case 'marker':
    case 'spawn_air':
      return (
        <mesh position={[0, 0.8, 0]}>
          <coneGeometry args={[0.5, 1.4, 6]} />
          <meshStandardMaterial color={part.color} emissive={part.color} emissiveIntensity={0.6} wireframe />
        </mesh>
      );
    case 'boundary':
      return (
        <mesh position={[0, part.size[1] / 2, 0]}>
          <boxGeometry args={[part.size[0] * 2, part.size[1], part.size[2] * 2]} />
          <meshStandardMaterial color={part.color} wireframe transparent opacity={0.25} />
        </mesh>
      );
    default:
      return (
        <mesh castShadow>
          <boxGeometry args={part.size} />
          <meshStandardMaterial color={part.color} />
        </mesh>
      );
  }
};

const EDIT_ONLY: ReadonlySet<DestinationPart['kind']> = new Set(['spawn_air', 'boundary', 'marker']);

const DestinationEntity = ({ part, editMode }: { part: DestinationPart; editMode: boolean }) => {
  const key = destinationPartKey(part.id);
  const base = { position: part.position, rotation: part.rotation, scale: part.scale };
  const m = useMergedTransform(key, base);
  const deleted = useIsDeleted(key);
  const collected = useDestinationRuntimeStore((s) => s.collectedIds.includes(part.id) || s.carryingId === part.id);
  if (deleted || !part.enabled) return null;
  if (!editMode && EDIT_ONLY.has(part.kind)) return null;
  if (!editMode && collected) return null; // picked up → hidden in the world

  if (editMode) {
    return (
      <EditableObject objKey={key} base={base} assetId={part.assetId ?? undefined}>
        <PartVisual part={part} />
      </EditableObject>
    );
  }
  if (part.kind === 'building') {
    return (
      <RigidBody type="fixed" colliders="cuboid" position={m.position} rotation={m.rotation}>
        <group scale={m.scale}>
          <PartVisual part={part} />
        </group>
      </RigidBody>
    );
  }
  return (
    <group position={m.position} rotation={m.rotation} scale={m.scale}>
      <PartVisual part={part} />
    </group>
  );
};

export const DestinationLayoutLayer = () => {
  const editMode = useUiStore((s) => s.editMode);
  const parts = useEditorDestinationStore((s) => s.items);
  return (
    <>
      {parts.map((p) => (
        <DestinationEntity key={p.id} part={p} editMode={editMode} />
      ))}
    </>
  );
};

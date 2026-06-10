import { useUiStore } from '../../stores/uiStore';
import { useEditorExteriorStore } from '../../stores/game/editorExteriorStore';
import { getModelAsset } from '../../data/modelLibrary';
import { NormalizedGlbModel } from '../world/NormalizedGlbModel';
import { EditableObject } from '../edit/EditableObject';
import { useMergedTransform, useIsDeleted } from '../../stores/sceneEditStore';
import { exteriorPartKey } from './exteriorPartKey';
import type { ExteriorPart } from '../../types/game/exterior';

// Renders the editable base exterior + flight-route markers. EDIT MODE: EditableObject + shared gizmo
// (drag navpoints/tower/etc.). PLAY: at the merged transform; the next navpoint glows. Clouds are soft
// sphere puffs. flight_spawn is an edit-only marker.

const CloudPuff = ({ color }: { color: string }) => (
  <group>
    {([[0, 0, 0], [1.4, 0.3, 0.4], [-1.2, 0.2, -0.5], [0.3, -0.2, 1.1]] as const).map((o, i) => (
      <mesh key={i} position={o}>
        <sphereGeometry args={[1.2, 12, 12]} />
        <meshStandardMaterial color={color} transparent opacity={0.85} depthWrite={false} />
      </mesh>
    ))}
  </group>
);

const PartVisual = ({ part, isNext }: { part: ExteriorPart; isNext: boolean }) => {
  if (part.assetId && getModelAsset(part.assetId)) {
    return <NormalizedGlbModel assetId={part.assetId} target={part.modelTarget && part.modelTarget > 0 ? part.modelTarget : undefined} />;
  }
  switch (part.kind) {
    case 'center_tower':
      return (
        <mesh position={[0, part.size[1] / 2, 0]} castShadow>
          <cylinderGeometry args={[part.size[0] / 2, part.size[0] / 2, part.size[1], 16]} />
          <meshStandardMaterial color={part.color} metalness={0.4} roughness={0.5} />
        </mesh>
      );
    case 'ring':
    case 'sky_gate':
      return (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[part.size[0], 0.5, 12, 48]} />
          <meshStandardMaterial color={part.color} emissive={part.color} emissiveIntensity={part.kind === 'sky_gate' ? 1.2 : 0.4} metalness={0.3} roughness={0.5} />
        </mesh>
      );
    case 'navpoint':
      return (
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={isNext ? 1.25 : 1}>
          <torusGeometry args={[part.size[0], 0.18, 10, 32]} />
          <meshStandardMaterial color={part.color} emissive={part.color} emissiveIntensity={isNext ? 2.4 : 0.7} transparent opacity={isNext ? 1 : 0.6} />
        </mesh>
      );
    case 'cloud':
      return <CloudPuff color={part.color} />;
    case 'flight_spawn':
      return (
        <mesh>
          <coneGeometry args={[0.8, 1.6, 6]} />
          <meshStandardMaterial color={part.color} emissive={part.color} emissiveIntensity={0.6} wireframe />
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

const ExteriorEntity = ({ part, editMode }: { part: ExteriorPart; editMode: boolean }) => {
  const key = exteriorPartKey(part.id);
  const base = { position: part.position, rotation: part.rotation, scale: part.scale };
  const m = useMergedTransform(key, base);
  const deleted = useIsDeleted(key);
  if (deleted) return null;
  if (!editMode && part.kind === 'flight_spawn') return null; // edit-only marker

  const isNext = false; // navpoints are retired; the route is the editorPathStore path (🛣 Tracks)
  if (editMode) {
    return (
      <EditableObject objKey={key} base={base} assetId={part.assetId ?? undefined}>
        <PartVisual part={part} isNext={isNext} />
      </EditableObject>
    );
  }
  return (
    <group position={m.position} rotation={m.rotation} scale={m.scale}>
      <PartVisual part={part} isNext={isNext} />
    </group>
  );
};

export const ExteriorLayer = () => {
  const editMode = useUiStore((s) => s.editMode);
  const parts = useEditorExteriorStore((s) => s.items);
  return (
    <>
      {parts.map((p) => (
        <ExteriorEntity key={p.id} part={p} editMode={editMode} />
      ))}
    </>
  );
};

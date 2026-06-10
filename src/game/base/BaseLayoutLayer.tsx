import { RigidBody } from '@react-three/rapier';
import { useUiStore } from '../../stores/uiStore';
import { useEditorBaseLayoutStore } from '../../stores/game/editorBaseLayoutStore';
import { getModelAsset } from '../../data/modelLibrary';
import { NormalizedGlbModel } from '../world/NormalizedGlbModel';
import { LiftDeck } from './LiftDeck';
import { EditableObject } from '../edit/EditableObject';
import { useMergedTransform, useIsDeleted } from '../../stores/sceneEditStore';
import { basePartKey } from './basePartKey';
import type { BasePart } from '../../types/game/base';

// Renders every editable base-layout part using the POLI gizmo pipeline: EDIT MODE wraps each part in
// EditableObject so the shared SceneEditorGizmo selects/moves it (W/E/R, Ctrl+Z undo, pointerOnGizmo —
// no mis-clicking objects behind the handle), writing the transform into sceneEditStore. PLAY MODE renders
// at the merged transform with the part's collider. The lift platform is owned by LiftPlatform in play.

const PartVisual = ({ part }: { part: BasePart }) => {
  if (part.assetId && getModelAsset(part.assetId)) {
    return <NormalizedGlbModel assetId={part.assetId} target={part.modelTarget && part.modelTarget > 0 ? part.modelTarget : undefined} />;
  }
  // Lift platform uses the SAME deck visual as play mode (no more box-vs-cylinder mismatch).
  if (part.kind === 'lift_platform') return <LiftDeck size={part.size} color={part.color} />;
  const emissive = part.kind === 'warning_light' || part.kind === 'base_exit';
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={part.size} />
      <meshStandardMaterial color={part.color} emissive={emissive ? part.color : '#000000'} emissiveIntensity={emissive ? 0.6 : 0} />
    </mesh>
  );
};

const BasePartEntity = ({ part, editMode }: { part: BasePart; editMode: boolean }) => {
  const key = basePartKey(part.id);
  const base = { position: part.position, rotation: part.rotation, scale: part.scale };
  const m = useMergedTransform(key, base);
  const deleted = useIsDeleted(key);
  if (deleted) return null;
  // Lift platform is owned by LiftPlatform in play; the spawn marker is edit-only (just a draggable point).
  if (!editMode && (part.kind === 'lift_platform' || part.kind === 'spawn')) return null;

  if (editMode) {
    return (
      <EditableObject objKey={key} base={base} assetId={part.assetId ?? undefined}>
        <PartVisual part={part} />
      </EditableObject>
    );
  }
  if (part.collision === 'none') {
    return (
      <group position={m.position} rotation={m.rotation} scale={m.scale}>
        <PartVisual part={part} />
      </group>
    );
  }
  return (
    <RigidBody type="fixed" colliders={part.collision} position={m.position} rotation={m.rotation}>
      <group scale={m.scale}>
        <PartVisual part={part} />
      </group>
    </RigidBody>
  );
};

export const BaseLayoutLayer = () => {
  const editMode = useUiStore((s) => s.editMode);
  const parts = useEditorBaseLayoutStore((s) => s.items);
  return (
    <>
      {parts.map((p) => (
        <BasePartEntity key={p.id} part={p} editMode={editMode} />
      ))}
    </>
  );
};

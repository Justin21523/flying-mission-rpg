import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import { useUiStore } from '../../stores/uiStore';
import { useEditorGameNpcStore } from '../../stores/game/editorGameNpcStore';
import { getModelAsset } from '../../data/modelLibrary';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { EditableObject } from '../edit/EditableObject';
import { useMergedTransform, useIsDeleted } from '../../stores/sceneEditStore';
import { objKey } from '../edit/sceneEditMerge';
import type { NPCDefinition } from '../../types/game/npc';

// Destination NPCs — every game NPC with a placement renders here (gizmo-draggable in edit; name marker +
// idle/wave bob in play). Interaction ([E] within interactionRadius) is handled by the objective director.
const npcPlacementKey = (id: string) => objKey('destination', 'npc', id);

const NpcVisual = ({ npc }: { npc: NPCDefinition }) => {
  const g = useRef<Group>(null);
  useFrame((s) => {
    if (!g.current) return;
    const t = s.clock.elapsedTime;
    if (npc.initialState === 'waving') g.current.rotation.z = Math.sin(t * 4) * 0.12;
    else if (npc.initialState === 'worried') g.current.position.x = Math.sin(t * 6) * 0.04;
    else g.current.position.y = Math.sin(t * 2) * 0.04; // idle/waiting gentle bob
  });
  const placeholder = (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.35, 0.7, 4, 10]} />
        <meshStandardMaterial color={npc.color} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color={npc.color} />
      </mesh>
    </group>
  );
  return (
    <group ref={g}>
      {npc.modelAssetId && getModelAsset(npc.modelAssetId) ? <AnimatedGlbModel assetId={npc.modelAssetId} fallback={placeholder} noCull /> : placeholder}
      <Html center distanceFactor={26} position={[0, 2.3, 0]}>
        <div className="pointer-events-none whitespace-nowrap rounded-full bg-slate-950/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
          ⭑ {npc.name}
        </div>
      </Html>
    </group>
  );
};

const NpcEntity = ({ npc, editMode }: { npc: NPCDefinition; editMode: boolean }) => {
  const key = npcPlacementKey(npc.id);
  const base = {
    position: (npc.position ?? [0, 0, 0]) as [number, number, number],
    rotation: [0, ((npc.rotationY ?? 0) * Math.PI) / 180, 0] as [number, number, number],
    scale: 1,
  };
  const m = useMergedTransform(key, base);
  const deleted = useIsDeleted(key);
  if (deleted || !npc.position) return null;

  if (editMode) {
    return (
      <EditableObject objKey={key} base={base} assetId={npc.modelAssetId ?? undefined}>
        <NpcVisual npc={npc} />
      </EditableObject>
    );
  }
  return (
    <group position={m.position} rotation={m.rotation} scale={m.scale}>
      <NpcVisual npc={npc} />
    </group>
  );
};

export const DestinationNpcLayer = () => {
  const editMode = useUiStore((s) => s.editMode);
  const npcs = useEditorGameNpcStore((s) => s.items);
  return (
    <>
      {npcs.map((n) => (
        <NpcEntity key={n.id} npc={n} editMode={editMode} />
      ))}
    </>
  );
};

import { Suspense, useEffect, useMemo } from 'react';
import { Text } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import type { Object3D } from 'three';
import { useNormalizedGlb } from './normalizeGlb';
import { useNpcScheduleStore } from '../../stores/npcScheduleStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import { useInteractionStore } from '../../stores/interactionStore';
import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';
import { useUiStore } from '../../stores/uiStore';
import { useMergedTransform } from '../../stores/sceneEditStore';
import { objKey } from '../edit/sceneEditMerge';
import type { BaseTransform } from '../edit/sceneEditMerge';
import { EditableObject } from '../edit/EditableObject';
import { Interactable } from '../interaction/Interactable';
import type { CharacterDefinition } from '../../types/character';
import { CORE_TEAM } from '../../data/characters/coreTeam';
import { RESIDENTS } from '../../data/characters/residents';

// Preload all known robot model paths so NPCs appear without stutter.
const KNOWN_ROBOT_PATHS = CORE_TEAM.filter((c) => c.modelRobotPath).map((c) => c.modelRobotPath!);
KNOWN_ROBOT_PATHS.forEach((p) => useGLTF.preload(p));

// ---- E-key interaction hook ------------------------------------------------
function usePoliInteraction(allChars: CharacterDefinition[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' || e.repeat) return;
      if (useDialogueStore.getState().isActive) return;
      const { currentTargetId, targetType } = useInteractionStore.getState();
      if (!currentTargetId || targetType !== 'npc') return;
      const char = allChars.find((c) => c.id === currentTargetId);
      if (!char || !char.dialogueTreeId) return;
      useDialogueStore.getState().startDialogue(char.dialogueTreeId);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [allChars]);
}

// Mark a troika <Text> mesh so the kit's EditableObject selection-tint traversal skips it.
// Cloning troika's derived material (what EditableObject does to every mesh on select) corrupts
// it and crashes the render loop ("baseMaterial.addEventListener is not a function").
const markEditHelper = (t: Object3D | null) => { if (t) t.userData.__editHelper = true; };

// ---- GLB body + capsule fallback -------------------------------------------
const NPC_HEIGHT = 1.9;
const CharacterGlb = ({ path }: { path: string }) => {
  // Auto-fit to NPC_HEIGHT with feet at y=0, regardless of the GLB's native export units.
  const { scene, scale, yOffset } = useNormalizedGlb(path, NPC_HEIGHT);
  return <primitive object={scene} scale={scale} position={[0, yOffset, 0]} />;
};

const CapsuleFallback = ({ color }: { color: string }) => (
  <mesh position={[0, 0.9, 0]} castShadow>
    <capsuleGeometry args={[0.4, 0.9, 4, 8]} />
    <meshStandardMaterial color={color} roughness={0.55} metalness={0.15} />
  </mesh>
);

const NpcBodyMesh = ({ char }: { char: CharacterDefinition }) => {
  if (!char.modelRobotPath) return <CapsuleFallback color={char.color} />;
  return (
    <Suspense fallback={<CapsuleFallback color={char.color} />}>
      <CharacterGlb path={char.modelRobotPath} />
    </Suspense>
  );
};

// ---- One NPC --------------------------------------------------------------
// Edit Mode: a kit EditableObject — click selects it (shared SceneEditorGizmo centres on it,
// EditModeInspector shows its transform, drag/numeric edits auto-save to sceneEditStore and
// apply in play mode through useMergedTransform). Play Mode: a talkable Interactable at the
// merged (schedule ⊕ editor) transform. Identical pattern to the kit's EditableNpcLayer.
interface PoliNpcEntityProps {
  char: CharacterDefinition;
  areaId: string;
}

const PoliNpcEntity = ({ char, areaId }: PoliNpcEntityProps) => {
  const editMode = useUiStore((s) => s.editMode);
  const key = objKey(areaId, 'npc', char.id);
  const schedPos = useNpcScheduleStore.getState().getCharacterPosition(char.id, areaId);
  const base: BaseTransform = { position: schedPos, rotation: [0, 0, 0], scale: 1 };
  const m = useMergedTransform(key, base);

  const visual = (
    <>
      <NpcBodyMesh char={char} />
      <Text
        ref={markEditHelper}
        position={[0, 2.2, 0]} fontSize={0.32} color="#ffffff"
        anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="#000000" renderOrder={1}
      >
        {char.name}
      </Text>
    </>
  );

  if (editMode) {
    return <EditableObject objKey={key} base={base}>{visual}</EditableObject>;
  }
  return (
    <Interactable
      id={char.id}
      type="npc"
      label={`Talk to ${char.name} [E]`}
      position={m.position}
      isSolid
      colliderArgs={[0.4, 1, 0.4]}
    >
      <group rotation={m.rotation} scale={m.scale}>{visual}</group>
    </Interactable>
  );
};

// ---- Layer -----------------------------------------------------------------
interface PoliNpcLayerProps {
  areaId: string;
}

export const PoliNpcLayer = ({ areaId }: PoliNpcLayerProps) => {
  const activeAreaMap = useNpcScheduleStore((s) => s.activeAreaMap);
  const editMode = useUiStore((s) => s.editMode);
  const overrides = useEditorPoliCharacterStore((s) => s.overrides);

  // Apply editor DATA overrides (model / colour / name) on top of the base character data.
  const allChars = useMemo(
    () =>
      [...CORE_TEAM.filter((c) => c.id !== 'poli'), ...RESIDENTS].map((c) => {
        const ov = overrides[c.id];
        return ov ? { ...c, ...ov } : c;
      }),
    [overrides],
  );

  // Edit mode: show every character that has a position defined for this area (so all are
  // placeable regardless of time-of-day). Play mode: only the characters the schedule puts here.
  const npcs = useMemo(() => {
    if (editMode) {
      return allChars.filter((c) => {
        const schedPos = useNpcScheduleStore.getState().getCharacterPosition(c.id, areaId);
        return schedPos[0] !== 0 || schedPos[1] !== 0 || schedPos[2] !== 0
          || useNpcScheduleStore.getState().activeAreaMap[c.id] === areaId;
      });
    }
    return allChars.filter((c) => activeAreaMap[c.id] === areaId);
  }, [allChars, activeAreaMap, areaId, editMode]);

  usePoliInteraction(allChars);

  return (
    <>
      {npcs.map((char) => (
        <PoliNpcEntity key={char.id} char={char} areaId={areaId} />
      ))}
    </>
  );
};

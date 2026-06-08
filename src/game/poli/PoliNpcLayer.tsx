import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Text, TransformControls } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import type { Group } from 'three';
import { useNpcScheduleStore } from '../../stores/npcScheduleStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import { useInteractionStore } from '../../stores/interactionStore';
import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';
import { useUiStore } from '../../stores/uiStore';
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

// ---- GLB body + capsule fallback -------------------------------------------
const CharacterGlb = ({ path }: { path: string }) => {
  const { scene } = useGLTF(path);
  const clone = useMemo(() => scene.clone(), [scene]);
  return <primitive object={clone} scale={0.85} position={[0, 0, 0]} />;
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

// ---- NPC entity (play mode) -------------------------------------------------
interface PoliNpcEntityProps {
  char: CharacterDefinition;
  position: [number, number, number];
}

const PoliNpcEntity = ({ char, position }: PoliNpcEntityProps) => (
  <Interactable
    id={char.id}
    type="npc"
    label={`Talk to ${char.name} [E]`}
    position={position}
    isSolid
    colliderArgs={[0.4, 1, 0.4]}
  >
    <NpcBodyMesh char={char} />
    <Text
      position={[0, 2.2, 0]} fontSize={0.32} color="#ffffff"
      anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="#000000" renderOrder={1}
    >
      {char.name}
    </Text>
  </Interactable>
);

// ---- NPC entity (edit mode — shows gizmo, saves position on drag) -----------
interface EditableNpcEntityProps {
  char: CharacterDefinition;
  position: [number, number, number];
}

const EditableNpcEntity = ({ char, position }: EditableNpcEntityProps) => {
  const groupRef = useRef<Group>(null);
  const setOverride = useEditorPoliCharacterStore((s) => s.setOverride);

  const onDragEnd = () => {
    if (!groupRef.current) return;
    const { x, y, z } = groupRef.current.position;
    setOverride(char.id, { positionOverride: [x, y, z] });
  };

  return (
    <TransformControls mode="translate" onMouseUp={onDragEnd}>
      <group ref={groupRef} position={position}>
        <NpcBodyMesh char={char} />
        {/* Edit-mode label */}
        <Text
          position={[0, 2.6, 0]} fontSize={0.28} color="#a78bfa"
          anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="#1e1e2e" renderOrder={1}
        >
          {char.name} [{char.id}]
        </Text>
      </group>
    </TransformControls>
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

  const allChars = useMemo(
    () =>
      [...CORE_TEAM.filter((c) => c.id !== 'poli'), ...RESIDENTS].map((c) => {
        const ov = overrides[c.id];
        return ov ? { ...c, ...ov } : c;
      }),
    [overrides],
  );

  // In edit mode show ALL characters registered in schedules for this area (ignores time-of-day).
  // In play mode show only characters whose active area matches.
  const npcs = useMemo(() => {
    if (editMode) {
      // Show all characters that have a position defined for this area.
      return allChars.filter((c) => {
        if (overrides[c.id]?.positionOverride) return activeAreaMap[c.id] === areaId;
        const schedPos = useNpcScheduleStore.getState().getCharacterPosition(c.id, areaId);
        return schedPos[0] !== 0 || schedPos[2] !== 0 || useNpcScheduleStore.getState().activeAreaMap[c.id] === areaId;
      });
    }
    return allChars.filter((c) => activeAreaMap[c.id] === areaId);
  }, [allChars, activeAreaMap, areaId, editMode, overrides]);

  usePoliInteraction(allChars);

  return (
    <>
      {npcs.map((char) => {
        // Resolve position: positionOverride > schedule-based
        const schedPos = useNpcScheduleStore.getState().getCharacterPosition(char.id, areaId);
        const pos = (overrides[char.id]?.positionOverride ?? schedPos) as [number, number, number];

        if (editMode) {
          return <EditableNpcEntity key={char.id} char={char} position={pos} />;
        }
        return <PoliNpcEntity key={char.id} char={char} position={pos} />;
      })}
    </>
  );
};

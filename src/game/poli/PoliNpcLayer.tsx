import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Text, TransformControls } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import { Vector3 } from 'three';
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

// Module-level temp vec — avoids per-frame allocation in gizmo drag handlers.
const _wp = new Vector3();

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

// ---- NPC entity (edit mode) -------------------------------------------------
// Outer group is positioned at world coords; inner body is at local origin so
// TransformControls gizmo appears centered on the character, not at scene origin.
interface EditableNpcEntityProps {
  char: CharacterDefinition;
  position: [number, number, number];
  isSelected: boolean;
}

const EditableNpcEntity = ({ char, position, isSelected }: EditableNpcEntityProps) => {
  const groupRef = useRef<Group>(null);
  const setOverride = useEditorPoliCharacterStore((s) => s.setOverride);
  const selectNpc = useEditorPoliCharacterStore((s) => s.selectNpc);

  // Called every frame while dragging — saves world position into override store.
  const onPositionChange = () => {
    if (!groupRef.current) return;
    groupRef.current.getWorldPosition(_wp);
    setOverride(char.id, { positionOverride: [_wp.x, _wp.y, _wp.z] });
  };

  return (
    // Outer group anchors the object at its world position.
    // The gizmo/body inside is at local [0,0,0] = the world position.
    <group position={position}>
      {isSelected ? (
        <TransformControls mode="translate" onObjectChange={onPositionChange}>
          <group ref={groupRef}>
            <NpcBodyMesh char={char} />
            <Text
              position={[0, 2.6, 0]} fontSize={0.28} color="#a78bfa"
              anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="#1e1e2e" renderOrder={1}
            >
              {char.name} [{char.id}]
            </Text>
          </group>
        </TransformControls>
      ) : (
        <group>
          <NpcBodyMesh char={char} />
          {/* Translucent hit volume — click to select this NPC in Edit Mode. */}
          <mesh
            position={[0, 1, 0]}
            onClick={(e) => { e.stopPropagation(); selectNpc(char.id); }}
          >
            <boxGeometry args={[0.9, 2, 0.9]} />
            <meshBasicMaterial color={char.color} transparent opacity={0.18} depthWrite={false} />
          </mesh>
          <Text
            position={[0, 2.6, 0]} fontSize={0.28} color="#94a3b8"
            anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="#1e1e2e" renderOrder={1}
          >
            {char.name} [{char.id}]
          </Text>
        </group>
      )}
    </group>
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
  const selectedNpcId = useEditorPoliCharacterStore((s) => s.selectedNpcId);

  const allChars = useMemo(
    () =>
      [...CORE_TEAM.filter((c) => c.id !== 'poli'), ...RESIDENTS].map((c) => {
        const ov = overrides[c.id];
        return ov ? { ...c, ...ov } : c;
      }),
    [overrides],
  );

  // Edit mode: show every character that has any position defined for this area.
  // Play mode: only show characters whose schedule puts them here right now.
  const npcs = useMemo(() => {
    if (editMode) {
      return allChars.filter((c) => {
        const ov = overrides[c.id];
        if (ov?.positionOverride) return true;
        const schedPos = useNpcScheduleStore.getState().getCharacterPosition(c.id, areaId);
        return schedPos[0] !== 0 || schedPos[1] !== 0 || schedPos[2] !== 0
          || useNpcScheduleStore.getState().activeAreaMap[c.id] === areaId;
      });
    }
    return allChars.filter((c) => activeAreaMap[c.id] === areaId);
  }, [allChars, activeAreaMap, areaId, editMode, overrides]);

  usePoliInteraction(allChars);

  return (
    <>
      {npcs.map((char) => {
        const schedPos = useNpcScheduleStore.getState().getCharacterPosition(char.id, areaId);
        const pos = (overrides[char.id]?.positionOverride ?? schedPos) as [number, number, number];

        if (editMode) {
          return (
            <EditableNpcEntity
              key={char.id}
              char={char}
              position={pos}
              isSelected={selectedNpcId === char.id}
            />
          );
        }
        return <PoliNpcEntity key={char.id} char={char} position={pos} />;
      })}
    </>
  );
};

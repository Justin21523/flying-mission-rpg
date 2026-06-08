import { useEffect, useMemo } from 'react';
import { Text } from '@react-three/drei';
import { useNpcScheduleStore } from '../../stores/npcScheduleStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import { useInteractionStore } from '../../stores/interactionStore';
import { Interactable } from '../interaction/Interactable';
import type { CharacterDefinition } from '../../types/character';
import { CORE_TEAM } from '../../data/characters/coreTeam';
import { RESIDENTS } from '../../data/characters/residents';

// All world-visible NPC characters — Poli is the player, excluded from world rendering.
const ALL_POLI_CHARACTERS: CharacterDefinition[] = [
  ...CORE_TEAM.filter((c) => c.id !== 'poli'),
  ...RESIDENTS,
];

// Registers an E-key handler for POLI NPC dialogue, additive to the kit's InteractionHandler.
// The kit handler silently fails for POLI NPC ids (not in getNpcProfile/getEditorNpc).
// This hook then finds the match in ALL_POLI_CHARACTERS and starts the dialogue.
function usePoliInteraction() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' || e.repeat) return;
      if (useDialogueStore.getState().isActive) return;
      const { currentTargetId, targetType } = useInteractionStore.getState();
      if (!currentTargetId || targetType !== 'npc') return;
      const char = ALL_POLI_CHARACTERS.find((c) => c.id === currentTargetId);
      if (!char || !char.dialogueTreeId) return;
      useDialogueStore.getState().startDialogue(char.dialogueTreeId);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}

interface PoliNpcEntityProps {
  char: CharacterDefinition;
  areaId: string;
}

const PoliNpcEntity = ({ char, areaId }: PoliNpcEntityProps) => {
  const pos = useNpcScheduleStore.getState().getCharacterPosition(char.id, areaId);
  return (
    <Interactable
      id={char.id}
      type="npc"
      label={`與 ${char.nameZhTW} 交談 [E]`}
      position={pos}
      isSolid
      colliderArgs={[0.4, 1, 0.4]}
    >
      {/* Capsule body */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.4, 0.9, 4, 8]} />
        <meshStandardMaterial color={char.color} roughness={0.55} metalness={0.15} />
      </mesh>
      {/* Name label floating above */}
      <Text
        position={[0, 2.2, 0]}
        fontSize={0.32}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
        renderOrder={1}
      >
        {char.nameZhTW}
      </Text>
    </Interactable>
  );
};

interface PoliNpcLayerProps {
  areaId: string;
}

export const PoliNpcLayer = ({ areaId }: PoliNpcLayerProps) => {
  const activeAreaMap = useNpcScheduleStore((s) => s.activeAreaMap);
  const npcs = useMemo(
    () => ALL_POLI_CHARACTERS.filter((c) => activeAreaMap[c.id] === areaId),
    [activeAreaMap, areaId],
  );
  usePoliInteraction();
  return (
    <>
      {npcs.map((char) => (
        <PoliNpcEntity key={char.id} char={char} areaId={areaId} />
      ))}
    </>
  );
};

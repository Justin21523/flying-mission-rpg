import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import { useEditorGameNpcStore } from '../../stores/game/editorGameNpcStore';
import { useSaveStore } from '../../stores/useSaveStore';
import { npcDefaults } from '../npc/npcDialogueSelect';
import type { NPCDefinition } from '../../types/game/npc';

// Batch E — the Hangar fills with rescued residents. Renders every hub-resident NPC whose id is in the save's
// rescuedNpcIds, at its editable hubPosition (gentle idle/wave bob + a name + side-quest marker). Side-quest
// interaction is handled by the Hub RescueRosterPanel (DOM), keeping this a pure visual layer.
const HubNpc = ({ npc }: { npc: NPCDefinition }) => {
  const g = useRef<Group>(null);
  useFrame((s) => {
    if (!g.current) return;
    const t = s.clock.elapsedTime;
    if (npc.initialState === 'waving') g.current.rotation.z = Math.sin(t * 4) * 0.12;
    else g.current.position.y = Math.sin(t * 2) * 0.04;
  });
  const color = npc.color || npcDefaults(npc.npcType).color;
  const pos = npc.hubPosition ?? [0, 0, 0];
  return (
    <group position={pos}>
      <group ref={g}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <capsuleGeometry args={[0.35, 0.7, 4, 10]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 1.5, 0]} castShadow>
          <sphereGeometry args={[0.28, 12, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <Html center distanceFactor={26} position={[0, 2.3, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-full bg-slate-950/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
            ⭑ {npc.name}{npc.hubSideQuestId ? ' ❗' : ''}
          </div>
        </Html>
      </group>
    </group>
  );
};

export const HangarNpcLayer = () => {
  const npcs = useEditorGameNpcStore((s) => s.items);
  const rescued = useSaveStore((s) => s.save.progress.rescuedNpcIds);
  const residents = npcs.filter((n) => n.hubResident && rescued.includes(n.id));
  return (
    <>
      {residents.map((n) => (
        <HubNpc key={n.id} npc={n} />
      ))}
    </>
  );
};

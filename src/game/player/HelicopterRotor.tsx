import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useTransformStore } from '../../stores/transformStore';
import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';
import { CORE_TEAM } from '../../data/characters/coreTeam';
import { playerMotion } from './playerMotion';

// Procedural helicopter rotor (top rotor only) built from primitives. Rendered by PlayerMesh while
// the active flyer is airborne. Spins ONLY while moving; still when hovering; gone on the ground.
//
// Its position + scale are EDITABLE in Edit Mode (POLI tab → Rotor Offset / Rotor Scale), read here
// from the merged character data (base ⊕ override) — nothing about it is hardcoded-only.
const SPIN = 26; // rad/s when moving
const DEFAULT_OFFSET: [number, number, number] = [0, 1.25, 0];

export const HelicopterRotor = () => {
  const spinRef = useRef<Group>(null);
  const charId = useTransformStore((s) => s.charId);
  const override = useEditorPoliCharacterStore((s) => s.overrides[charId]);
  const base = CORE_TEAM.find((c) => c.id === charId);
  const offset = override?.rotorOffset ?? base?.rotorOffset ?? DEFAULT_OFFSET;
  const scale = override?.rotorScale ?? base?.rotorScale ?? 1;

  useFrame((_, dt) => {
    if (!useTransformStore.getState().flying || !playerMotion.moving) return;
    if (spinRef.current) spinRef.current.rotation.y += SPIN * Math.min(dt, 0.05);
  });

  return (
    <group position={offset} scale={scale}>
      {/* Mast */}
      <mesh position={[0, -0.18, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.36, 8]} />
        <meshStandardMaterial color="#444b55" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Main rotor (spins around Y) */}
      <group ref={spinRef}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.12, 10]} />
          <meshStandardMaterial color="#2b3038" metalness={0.7} roughness={0.3} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]} position={[0, 0.02, 0]} castShadow>
            <boxGeometry args={[2.4, 0.03, 0.16]} />
            <meshStandardMaterial color="#1f242b" metalness={0.3} roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

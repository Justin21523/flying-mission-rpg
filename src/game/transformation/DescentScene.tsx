import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Group } from 'three';
import { WorldSkyAmbience } from '../flight/world/WorldSkyAmbience';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { descentEntry } from './descentEntry';

// DESCENT — the robot drifts slowly downward MID-AIR (open sky, distant cloud puffs far below — NO ground
// visible; the editable `aero_destination` ground appears at Batch 7 LANDING when the descent reaches it).
// Uses the momentum handed over by the transformation exit (descentEntry.velocity, softened for the
// placeholder). Full descent control + landing are Batch 7.
const PUFFS: { x: number; z: number; s: number }[] = [];
for (let i = 0; i < 40; i++) {
  const a = (i / 40) * Math.PI * 2;
  const r = 25 + ((i * 37) % 90);
  PUFFS.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, s: 6 + ((i * 13) % 9) });
}

export const DescentScene = () => {
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const hero = useRef<Group>(null);
  const cloudY = useMemo(() => -70, []);
  const fallback = (
    <mesh castShadow>
      <boxGeometry args={[0.8, 1.2, 0.6]} />
      <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
    </mesh>
  );

  useFrame((_, dt) => {
    // gentle continuous sink — the world clouds rise past as the hero descends (placeholder feel)
    if (hero.current) hero.current.position.y -= Math.min(descentEntry.velocity, 12) * 0.08 * dt;
  });

  return (
    <>
      <WorldSkyAmbience top="#3f7fd0" bottom="#cfe3ff" />
      {/* distant cloud puffs far BELOW — keeps the scene clearly airborne (no ground) */}
      <group position={[0, cloudY, 0]}>
        {PUFFS.map((p, i) => (
          <mesh key={i} position={[p.x, ((i * 7) % 20) - 10, p.z]} scale={p.s}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.8} depthWrite={false} roughness={1} flatShading />
          </mesh>
        ))}
      </group>
      <group ref={hero} position={[0, 2, 0]} scale={1.4}>
        {character?.modelAssetId ? <AnimatedGlbModel assetId={character.modelAssetId} fallback={fallback} noCull /> : fallback}
      </group>
      <OrbitControls makeDefault target={[0, 1, 0]} />
    </>
  );
};

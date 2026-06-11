import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useGameStore } from '../../stores/game/useGameStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { robotHandle } from './robotHandle';

// LANDING — the robot settles where it touched down (small squash-and-recover pose) while the quality
// banner shows, then hands off to NPC_GREETING. Landing re-evaluation is disabled here by construction.
const SETTLE_SEC = 2.2;

export const LandingSettle = () => {
  const group = useRef<Group>(null);
  const t = useRef(0);
  const fired = useRef(false);
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;

  useEffect(() => {
    t.current = 0;
    fired.current = false;
  }, []);

  useFrame((_, dt) => {
    t.current += dt;
    const g = group.current;
    if (g) {
      g.position.copy(robotHandle.pos);
      const k = Math.min(1, t.current / 0.5);
      g.scale.set(1.4 * (1 + (1 - k) * 0.12), 1.4 * (1 - (1 - k) * 0.18), 1.4 * (1 + (1 - k) * 0.12)); // squash → recover
    }
    if (t.current >= SETTLE_SEC && !fired.current) {
      fired.current = true;
      useGameStore.getState().requestTransition('NPC_GREETING');
    }
  });

  const fallback = (
    <mesh castShadow>
      <boxGeometry args={[0.8, 1.2, 0.6]} />
      <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
    </mesh>
  );
  return (
    <group ref={group} scale={1.4}>
      {character?.modelAssetId ? <AnimatedGlbModel assetId={character.modelAssetId} fallback={fallback} noCull /> : fallback}
    </group>
  );
};

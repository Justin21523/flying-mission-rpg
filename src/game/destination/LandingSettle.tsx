import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useGameStore } from '../../stores/game/useGameStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useFlightStore } from '../../stores/game/useFlightStore';
import { getMissionZoneForLocation } from '../../stores/game/editorMissionZoneStore';
import { startMissionZone } from '../advanced-mission-zone/AdvancedMissionZoneDirector';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { robotHandle } from './robotHandle';
import { groundCharacterScale } from './groundCharacterScale';
import { characterModelForForm } from './characterModel';

// LANDING — the robot settles where it touched down (small squash-and-recover pose) while the quality
// banner shows, then hands off to NPC_GREETING. Landing re-evaluation is disabled here by construction.
const SETTLE_SEC = 2.2;

export const LandingSettle = () => {
  const group = useRef<Group>(null);
  const t = useRef(0);
  const fired = useRef(false);
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const baseScale = groundCharacterScale(character);

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
      g.scale.set(baseScale * (1 + (1 - k) * 0.12), baseScale * (1 - (1 - k) * 0.18), baseScale * (1 + (1 - k) * 0.12)); // squash → recover
    }
    if (t.current >= SETTLE_SEC && !fired.current) {
      fired.current = true;
      // If this location has an Advanced Mission Zone, route into it; otherwise keep the legacy NPC flow.
      const zone = getMissionZoneForLocation(useFlightStore.getState().currentLocationId);
      if (zone && startMissionZone(zone.id)) {
        useGameStore.getState().requestTransition('ADVANCED_MISSION_ZONE');
      } else {
        useGameStore.getState().requestTransition('NPC_GREETING');
      }
    }
  });

  const fallback = (
    <mesh castShadow>
      <boxGeometry args={[0.8, 1.2, 0.6]} />
      <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
    </mesh>
  );
  return (
    <group ref={group} scale={baseScale}>
      {characterModelForForm(character, 'robot') ? <AnimatedGlbModel assetId={characterModelForForm(character, 'robot')!} animation={character?.idleAnimation} rules={character?.animationRules} fallback={fallback} noCull /> : fallback}
    </group>
  );
};

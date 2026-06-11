import { OrbitControls } from '@react-three/drei';
import { WorldSkyAmbience } from '../flight/world/WorldSkyAmbience';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';

// DESCENT — minimal handoff after the transformation (full descent/landing/NPC is Batch 7). Shows the
// robot-form character above the cloud floor under open sky; orbit camera. The momentum (descentEntry) is
// computed at the transform exit and will be consumed by the real descent controller in Batch 7.
export const DescentScene = () => {
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const fallback = (
    <mesh castShadow>
      <boxGeometry args={[0.8, 1.2, 0.6]} />
      <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
    </mesh>
  );
  return (
    <>
      <WorldSkyAmbience top="#3f7fd0" bottom="#cfe3ff" />
      <group position={[0, 0, 0]} scale={1.4}>
        {character?.modelAssetId ? <AnimatedGlbModel assetId={character.modelAssetId} fallback={fallback} noCull /> : fallback}
      </group>
      <OrbitControls makeDefault target={[0, 0, 0]} />
    </>
  );
};

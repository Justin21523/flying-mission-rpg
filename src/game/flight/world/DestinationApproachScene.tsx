import { OrbitControls } from '@react-three/drei';
import { WorldSkyAmbience } from './WorldSkyAmbience';
import { CloudField } from './CloudField';
import { useCharacterStore } from '../../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../../stores/game/editorCharacterStore';
import { AnimatedGlbModel } from '../../world/AnimatedGlbModel';
import { flightHandle } from '../flightHandle';

// DESTINATION_APPROACH — minimal handoff after WORLD_FLIGHT (full descent/landing + destination city are
// Batch 7). Shows the open sky + cloud carpet with the craft hovering at the arrival point, orbit camera.
// Kept intentionally small so it doesn't pre-build Batch 7.
export const DestinationApproachScene = () => {
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const p: [number, number, number] = [flightHandle.pos.x, flightHandle.pos.y, flightHandle.pos.z];
  const fallback = (
    <mesh castShadow>
      <coneGeometry args={[0.7, 2.2, 6]} />
      <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
    </mesh>
  );
  return (
    <>
      <WorldSkyAmbience />
      <CloudField />
      <group position={p}>
        {character?.modelAssetId ? <AnimatedGlbModel assetId={character.modelAssetId} fallback={fallback} noCull /> : fallback}
      </group>
      <OrbitControls makeDefault target={p} />
    </>
  );
};

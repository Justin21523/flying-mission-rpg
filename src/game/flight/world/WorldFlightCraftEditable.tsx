import { useCharacterStore } from '../../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../../stores/game/editorCharacterStore';
import { getFlightTuning } from '../../../stores/game/editorFlightStore';
import { AnimatedGlbModel } from '../../world/AnimatedGlbModel';
import { EditableObject } from '../../edit/EditableObject';
import { WORLD_CRAFT_KEY, routeStartNode } from './worldCraftKey';

// Edit-only selectable craft/character in WORLD_FLIGHT: shows the chosen character model at the route start
// so the author can click it and adjust facing/scale/offset with the shared SceneEditorGizmo. The transform
// is authored data (flight tuning: worldCraftOffset / worldCraftYawDeg / worldCraftScale) — baked on drag-end
// by WorldFlightScene's gizmo onCommit. Play uses RouteFollower with the same tuning, so Edit≈Play.
const DEG = Math.PI / 180;

export const WorldFlightCraftEditable = () => {
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const tuning = getFlightTuning();
  const start = routeStartNode();
  const off = tuning.worldCraftOffset;
  const base = {
    position: [start[0] + off[0], start[1] + off[1], start[2] + off[2]] as [number, number, number],
    rotation: [0, tuning.worldCraftYawDeg * DEG, 0] as [number, number, number],
    scale: tuning.worldCraftScale,
  };
  const fallback = (
    <mesh castShadow>
      <coneGeometry args={[0.7, 2.2, 6]} />
      <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
    </mesh>
  );
  return (
    <EditableObject objKey={WORLD_CRAFT_KEY} base={base}>
      {character?.modelAssetId ? <AnimatedGlbModel assetId={character.modelAssetId} animation={character.flightAnimation} fallback={fallback} noCull /> : fallback}
    </EditableObject>
  );
};

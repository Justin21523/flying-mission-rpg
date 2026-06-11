import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { getFlightTuning } from '../../stores/game/editorFlightStore';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { characterModelForForm } from '../destination/characterModel';
import { EditableObject } from '../edit/EditableObject';
import { BASE_CRAFT_KEY, baseLoopStartNode } from './baseCraftKey';

// Edit-only selectable craft for the BASE fly-around loop: shows the character's plane model at the loop
// start so the author can click it and adjust facing/scale/offset with the shared SceneEditorGizmo. The
// transform is authored data (flyAroundCraftOffset / Yaw / Scale) — baked on drag-end by FlightScene's gizmo
// onCommit. Play uses FlightController with the same tuning, so Edit≈Play.
const DEG = Math.PI / 180;

export const BaseFlightCraftEditable = () => {
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const tuning = getFlightTuning();
  const start = baseLoopStartNode();
  const off = tuning.flyAroundCraftOffset;
  const base = {
    position: [start[0] + off[0], start[1] + off[1], start[2] + off[2]] as [number, number, number],
    rotation: [0, tuning.flyAroundCraftYawDeg * DEG, 0] as [number, number, number],
    scale: tuning.flyAroundCraftScale,
  };
  const modelId = characterModelForForm(character, 'plane');
  const fallback = (
    <mesh castShadow>
      <coneGeometry args={[0.7, 2.2, 6]} />
      <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
    </mesh>
  );
  return (
    <EditableObject objKey={BASE_CRAFT_KEY} base={base}>
      {modelId ? <AnimatedGlbModel assetId={modelId} animation={character?.flightAnimation} rules={character?.animationRules} fallback={fallback} noCull /> : fallback}
    </EditableObject>
  );
};

import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { useEditorFlightStore } from '../../stores/game/editorFlightStore';
import { useFlightPreviewStore } from '../../stores/game/flightPreviewStore';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { characterModelForForm } from '../destination/characterModel';
import { EditableObject } from '../edit/EditableObject';
import { BASE_CRAFT_KEY, baseLoopStartNode } from './baseCraftKey';
import { FLIGHT_PATH_ID } from '../../data/game/flightPath';
import { resolveFlightCraftTransform } from './flightTimelineTransforms';

// Edit-only selectable craft for the BASE fly-around loop: shows the character's plane model at the loop
// start so the author can click it and adjust facing/scale/offset with the shared SceneEditorGizmo. The
// transform is authored data (flyAroundCraftOffset / Yaw / Scale) — baked on drag-end by FlightScene's gizmo
// onCommit. Play uses FlightController with the same tuning, so Edit≈Play.
const DEG = Math.PI / 180;

export const BaseFlightCraftEditable = () => {
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const tuning = useEditorFlightStore((s) => s.tuning);
  const u = useFlightPreviewStore((s) => s.u);
  const start = baseLoopStartNode();
  const resolved = resolveFlightCraftTransform({
    pathId: FLIGHT_PATH_ID,
    direction: 'forward',
    u,
    fallbackOffset: tuning.flyAroundCraftOffset,
    fallbackScale: tuning.flyAroundCraftScale,
    tracks: tuning.flyAroundTimeTracks,
  });
  const base = {
    position: resolved.position[0] === 0 && resolved.position[1] === 0 && resolved.position[2] === 0
      ? [start[0] + tuning.flyAroundCraftOffset[0], start[1] + tuning.flyAroundCraftOffset[1], start[2] + tuning.flyAroundCraftOffset[2]] as [number, number, number]
      : resolved.position,
    rotation: [resolved.rotation[0] * DEG, resolved.rotation[1] * DEG, resolved.rotation[2] * DEG] as [number, number, number],
    scale: resolved.scale,
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
      <group rotation={[0, tuning.flyAroundCraftYawDeg * DEG, 0]}>
        {modelId ? <AnimatedGlbModel assetId={modelId} animation={character?.flightAnimation} rules={character?.animationRules} fallback={fallback} noCull /> : fallback}
      </group>
    </EditableObject>
  );
};

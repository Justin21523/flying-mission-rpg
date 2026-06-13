import { useCharacterStore } from '../../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../../stores/game/editorCharacterStore';
import { useEditorFlightStore } from '../../../stores/game/editorFlightStore';
import { useFlightPreviewStore } from '../../../stores/game/flightPreviewStore';
import { AnimatedGlbModel } from '../../world/AnimatedGlbModel';
import { EditableObject } from '../../edit/EditableObject';
import { WORLD_CRAFT_KEY, routeStartNode } from './worldCraftKey';
import { resolveFlightCraftTransform } from '../flightTimelineTransforms';
import type { FlightLegDirection } from '../flightLeg';
import type { FlightTimelineTrack } from '../../../types/game/flightTimeline';

// Edit-only selectable craft/character in WORLD_FLIGHT: shows the chosen character model at the route start
// so the author can click it and adjust facing/scale/offset with the shared SceneEditorGizmo. The transform
// is authored data (flight tuning: worldCraftOffset / worldCraftYawDeg / worldCraftScale) — baked on drag-end
// by WorldFlightScene's gizmo onCommit. Play uses RouteFollower with the same tuning, so Edit≈Play.
const DEG = Math.PI / 180;

export const WorldFlightCraftEditable = ({
  pathId,
  direction,
  timeTracks,
}: {
  pathId: string;
  direction: FlightLegDirection;
  timeTracks?: readonly FlightTimelineTrack[];
}) => {
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const tuning = useEditorFlightStore((s) => s.tuning);
  const u = useFlightPreviewStore((s) => s.u);
  const start = routeStartNode();
  const resolved = resolveFlightCraftTransform({
    pathId,
    direction,
    u,
    fallbackOffset: tuning.worldCraftOffset,
    fallbackScale: tuning.worldCraftScale,
    tracks: timeTracks,
  });
  const base = {
    position: resolved.position[0] === 0 && resolved.position[1] === 0 && resolved.position[2] === 0
      ? [start[0] + tuning.worldCraftOffset[0], start[1] + tuning.worldCraftOffset[1], start[2] + tuning.worldCraftOffset[2]] as [number, number, number]
      : resolved.position,
    rotation: [resolved.rotation[0] * DEG, resolved.rotation[1] * DEG, resolved.rotation[2] * DEG] as [number, number, number],
    scale: resolved.scale,
  };
  const fallback = (
    <mesh castShadow>
      <coneGeometry args={[0.7, 2.2, 6]} />
      <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
    </mesh>
  );
  return (
    <EditableObject objKey={WORLD_CRAFT_KEY} base={base}>
      <group rotation={[0, tuning.worldCraftYawDeg * DEG, 0]}>
        {character?.modelAssetId ? <AnimatedGlbModel assetId={character.modelAssetId} animation={character.flightAnimation} fallback={fallback} noCull /> : fallback}
      </group>
    </EditableObject>
  );
};

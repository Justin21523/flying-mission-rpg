import { useCallback, useEffect } from 'react';
import { useUiStore } from '../../../stores/uiStore';
import { useSceneEditStore } from '../../../stores/sceneEditStore';
import { useEditorFlightStore } from '../../../stores/game/editorFlightStore';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';
import { useEditorMissionStore } from '../../../stores/game/editorMissionStore';
import { useFlightStore } from '../../../stores/game/useFlightStore';
import { useMissionStore } from '../../../stores/game/useMissionStore';
import type { FlightTuning } from '../../../types/game/flightControl';
import { EditModeAmbience } from '../../edit/EditModeAmbience';
import { WorldFlightEnvironment } from './WorldFlightEnvironment';
import { SceneEditorGizmo } from '../../edit/SceneEditorGizmo';
import { asScaleNum } from '../../edit/sceneEditMerge';
import { FollowCamera } from '../../camera/FollowCamera';
import { PathDebugLayer } from '../../poli/PathDebugLayer';
import { FlightCamera } from '../FlightCamera';
import { RouteFollower } from './RouteFollower';
import { CloudField } from './CloudField';
import { SpeedField } from './SpeedField';
import { CloudBreakEffect } from '../effects/CloudBreakEffect';
import { FlightAudioHost } from '../../audio/FlightAudioHost';
import { FlightEventDirectorHost } from './FlightEventDirectorHost';
import { FlightEventRenderer } from './FlightEventRenderer';
import { FlightEventPreview } from './FlightEventPreview';
import { WorldFlightDebugGizmos } from './WorldFlightDebugGizmos';
import { WorldFlightCraftEditable } from './WorldFlightCraftEditable';
import { WORLD_CRAFT_KEY, routeStartNode } from './worldCraftKey';
import { FlightPreviewController } from '../FlightPreviewController';
import { FlightCuePreview } from '../FlightCuePreview';
import { FlightCuePlayController } from '../FlightCuePlayController';
import { getActivePathId } from './worldRoute';
import { useFlightPreviewStore } from '../../../stores/game/flightPreviewStore';
import { worldFlightSceneLayers } from './worldFlightSceneLayers';
import { clearActiveFlightEvents } from './flightEventRuntime';
import { useWorldFlightRuntimeStore } from '../../../stores/game/worldFlightRuntimeStore';
import { useFlightScoreStore } from '../../../stores/game/flightScoreStore';
import { FlightCelebrationLayer } from './FlightCelebrationLayer';
import { FlightLegCameraGizmo } from '../FlightLegCameraGizmo';
import { useWorldFlightEditorStore } from '../../../stores/game/worldFlightEditorStore';

const RAD2DEG = 180 / Math.PI;

// WORLD_FLIGHT — the long-distance high-altitude leg (PDF §批次5). Layer visibility is decided by the pure
// worldFlightSceneLayers(editMode): PLAY runs the rich system (ambience · clouds · speed · event director +
// renderer · RouteFollower · FlightCamera); EDIT is a CLEAN authoring view (flat-bright ambience · route line
// + draggable nodes · segment gizmos · the selectable craft/character · user-orbit camera) with NO clouds /
// fog / speed / event clutter. All runtime is disposed on exit.
export const WorldFlightScene = () => {
  const editMode = useUiStore((s) => s.editMode);
  const editViewMode = useWorldFlightEditorStore((s) => s.editViewMode);
  const layers = worldFlightSceneLayers(editMode, editViewMode);
  const tuning = useEditorFlightStore((s) => s.tuning);
  const preview = useFlightPreviewStore((s) => s.playing || s.u > 0.001);
  const previewFlightCam = useFlightPreviewStore((s) => (s.playing || s.u > 0.001) && s.cameraMode === 'flight');
  useFlightStore((s) => s.currentRouteId);
  useMissionStore((s) => s.currentMissionId);
  useEditorRouteStore((s) => s.items);
  useEditorMissionStore((s) => s.items);
  const activePathId = getActivePathId();

  useEffect(() => {
    return () => {
      clearActiveFlightEvents();
      useWorldFlightRuntimeStore.getState().reset();
      useFlightScoreStore.getState().reset();
    };
  }, []);

  // Bake a finished craft gizmo drag into the authored flight tuning (offset relative to the route start,
  // yaw degrees, scale) and clear the override — so the craft transform lives in authored data, not runtime.
  const bakeCraft = useCallback((key: string) => {
    if (key !== WORLD_CRAFT_KEY) return;
    const ov = useSceneEditStore.getState().overrides[key];
    if (!ov) return;
    const start = routeStartNode();
    const patch: Partial<FlightTuning> = {};
    if (ov.position) patch.worldCraftOffset = [ov.position[0] - start[0], ov.position[1] - start[1], ov.position[2] - start[2]];
    if (ov.rotation) patch.worldCraftYawDeg = ov.rotation[1] * RAD2DEG;
    if (ov.scale !== undefined) patch.worldCraftScale = asScaleNum(ov.scale);
    useEditorFlightStore.getState().update(patch);
    useSceneEditStore.getState().setOverride(key, { position: undefined, rotation: undefined, scale: undefined });
  }, []);

  return (
    <>
      {layers.ambience === 'edit' ? <EditModeAmbience /> : <WorldFlightEnvironment />}

      {layers.pathDebug && <PathDebugLayer areaId="world" pathId={activePathId} />}

      {layers.routeFollower && <RouteFollower />}
      {!editMode && <FlightCuePlayController pathId={activePathId} />}
      {layers.clouds && <CloudField />}
      {layers.speed && <SpeedField />}
      {layers.speed && <CloudBreakEffect />}
      {!editMode && <FlightAudioHost />}
      {layers.events && (
        <>
          <FlightEventDirectorHost />
          <FlightEventRenderer />
          <FlightCelebrationLayer />
        </>
      )}
      {layers.eventPreview && <FlightEventPreview />}

      {layers.segmentGizmos && <WorldFlightDebugGizmos />}
      {layers.editableCraft && !preview && <WorldFlightCraftEditable />}
      {editMode && <FlightPreviewController pathId={activePathId} craftScale={tuning.worldCraftScale} craftYaw={tuning.worldCraftYawDeg} />}
      {editMode && <FlightCuePreview pathId={activePathId} />}
      {editMode && <FlightLegCameraGizmo />}

      {/* EDIT: orbit camera, unless previewing with Camera = Flight (shows the authored worldCam* framing +
          craft scale live). PLAY: the flight camera. */}
      {!editMode ? <FlightCamera /> : previewFlightCam ? <FlightCamera /> : <FollowCamera />}
      {layers.sceneGizmo && <SceneEditorGizmo onCommit={bakeCraft} />}
    </>
  );
};

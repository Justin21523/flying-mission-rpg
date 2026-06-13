import { useCallback, useEffect } from 'react';
import { useUiStore } from '../../../stores/uiStore';
import { useSceneEditStore } from '../../../stores/sceneEditStore';
import { useEditorFlightStore } from '../../../stores/game/editorFlightStore';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';
import { useEditorMissionStore } from '../../../stores/game/editorMissionStore';
import { useGameStore } from '../../../stores/game/useGameStore';
import { useFlightStore } from '../../../stores/game/useFlightStore';
import { useMissionStore } from '../../../stores/game/useMissionStore';
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
import { WORLD_CRAFT_KEY } from './worldCraftKey';
import { FlightPreviewController } from '../FlightPreviewController';
import { FlightCuePreview } from '../FlightCuePreview';
import { FlightCuePlayController } from '../FlightCuePlayController';
import { getActiveFlightLeg, getActiveRoute } from './worldRoute';
import { useFlightPreviewStore } from '../../../stores/game/flightPreviewStore';
import { worldFlightSceneLayers } from './worldFlightSceneLayers';
import { clearActiveFlightEvents } from './flightEventRuntime';
import { useWorldFlightRuntimeStore } from '../../../stores/game/worldFlightRuntimeStore';
import { useFlightScoreStore } from '../../../stores/game/flightScoreStore';
import { FlightCelebrationLayer } from './FlightCelebrationLayer';
import { FlightLegCameraGizmo } from '../FlightLegCameraGizmo';
import { useWorldFlightEditorStore } from '../../../stores/game/worldFlightEditorStore';
import { resolveFlightLeg } from '../flightLeg';
import { offsetFromWorldPosition } from '../flightTimelineTransforms';
import { upsertFlightTimeKeyframe } from '../flightTimeTracks';
import type { FlightTimelineKeyframe } from '../../../types/game/flightTimeline';

const RAD2DEG = 180 / Math.PI;

// WORLD_FLIGHT — the long-distance high-altitude leg (PDF §批次5). Layer visibility is decided by the pure
// worldFlightSceneLayers(editMode): PLAY runs the rich system (ambience · clouds · speed · event director +
// renderer · RouteFollower · FlightCamera); EDIT is a CLEAN authoring view (flat-bright ambience · route line
// + draggable nodes · segment gizmos · the selectable craft/character · user-orbit camera) with NO clouds /
// fog / speed / event clutter. All runtime is disposed on exit.
export const WorldFlightScene = () => {
  const editMode = useUiStore((s) => s.editMode);
  const editViewMode = useWorldFlightEditorStore((s) => s.editViewMode);
  const selectedRouteId = useWorldFlightEditorStore((s) => s.selectedRouteId);
  const selectedLeg = useWorldFlightEditorStore((s) => s.selectedLeg);
  const pathOverlayMode = useWorldFlightEditorStore((s) => s.pathOverlayMode);
  const layers = worldFlightSceneLayers(editMode, editViewMode);
  const tuning = useEditorFlightStore((s) => s.tuning);
  const previewFlightCam = useFlightPreviewStore((s) => (s.playing || s.u > 0.001) && s.cameraMode === 'flight');
  useFlightStore((s) => s.currentRouteId);
  useMissionStore((s) => s.currentMissionId);
  const routes = useEditorRouteStore((s) => s.items);
  useEditorMissionStore((s) => s.items);
  const runtimeLeg = getActiveFlightLeg(useGameStore.getState().phase === 'RETURN_FLIGHT' ? 'return' : 'outbound');
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? getActiveRoute();
  const editLeg = resolveFlightLeg(selectedRoute, selectedLeg);
  const sceneLeg = editMode ? editLeg : runtimeLeg;
  const debugPathId = editMode && pathOverlayMode === 'all-world-routes' ? undefined : sceneLeg.pathId;

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
    if (!selectedRoute) return;
    const route = useEditorRouteStore.getState().items.find((item) => item.id === selectedRoute.id);
    if (!route) return;
    const u = useFlightPreviewStore.getState().u;
    const frame: Omit<FlightTimelineKeyframe, 'u'> = {};
    if (ov.position) frame.position = offsetFromWorldPosition(sceneLeg.pathId, sceneLeg.direction, u, ov.position);
    if (ov.rotation) frame.rotation = [ov.rotation[0] * RAD2DEG, ov.rotation[1] * RAD2DEG, ov.rotation[2] * RAD2DEG];
    if (ov.scale !== undefined) frame.scale = asScaleNum(ov.scale) ?? undefined;
    useEditorRouteStore.getState().update(route.id, {
      timeTracks: upsertFlightTimeKeyframe(route.timeTracks, { kind: 'craft' }, u, frame),
    });
    useSceneEditStore.getState().setOverride(key, { position: undefined, rotation: undefined, scale: undefined });
  }, [sceneLeg.direction, sceneLeg.pathId, selectedRoute]);
  const writeCraftKey = useCallback((key: string) => {
    if (key !== WORLD_CRAFT_KEY) return;
    const ov = useSceneEditStore.getState().overrides[key];
    if (!ov) return;
    if (!selectedRoute) return;
    const route = useEditorRouteStore.getState().items.find((item) => item.id === selectedRoute.id);
    if (!route) return;
    const u = useFlightPreviewStore.getState().u;
    const frame: Omit<FlightTimelineKeyframe, 'u'> = {};
    if (ov.position) frame.position = offsetFromWorldPosition(sceneLeg.pathId, sceneLeg.direction, u, ov.position);
    if (ov.rotation) frame.rotation = [ov.rotation[0] * RAD2DEG, ov.rotation[1] * RAD2DEG, ov.rotation[2] * RAD2DEG];
    if (ov.scale !== undefined) frame.scale = asScaleNum(ov.scale) ?? undefined;
    useEditorRouteStore.getState().update(route.id, {
      timeTracks: upsertFlightTimeKeyframe(route.timeTracks, { kind: 'craft' }, u, frame),
    });
  }, [sceneLeg.direction, sceneLeg.pathId, selectedRoute]);

  return (
    <>
      {layers.ambience === 'edit' ? <EditModeAmbience /> : <WorldFlightEnvironment />}

      {layers.pathDebug && <PathDebugLayer areaId="world" pathId={debugPathId} />}

      {layers.routeFollower && <RouteFollower />}
      {!editMode && <FlightCuePlayController pathId={runtimeLeg.pathId} cueKey={runtimeLeg.cueKey} direction={runtimeLeg.direction} />}
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
      {layers.editableCraft && <WorldFlightCraftEditable pathId={editLeg.pathId} direction={editLeg.direction} timeTracks={selectedRoute?.timeTracks} />}
      {editMode && <FlightPreviewController pathId={editLeg.pathId} direction={editLeg.direction} craftScale={tuning.worldCraftScale} craftYaw={tuning.worldCraftYawDeg} fallbackOffset={tuning.worldCraftOffset} timeTracks={selectedRoute?.timeTracks} showCraft={false} />}
      {editMode && <FlightCuePreview pathId={editLeg.pathId} cueKey={editLeg.cueKey} direction={editLeg.direction} />}
      {editMode && <FlightLegCameraGizmo />}

      {/* EDIT: orbit camera, unless previewing with Camera = Flight (shows the authored worldCam* framing +
          craft scale live). PLAY: the flight camera. */}
      {!editMode ? <FlightCamera /> : previewFlightCam ? <FlightCamera /> : <FollowCamera />}
      {layers.sceneGizmo && <SceneEditorGizmo onCommit={bakeCraft} onChange={writeCraftKey} />}
    </>
  );
};

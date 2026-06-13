import { useCallback } from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useUiStore } from '../../stores/uiStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import { useEditorFlightStore } from '../../stores/game/editorFlightStore';
import type { FlightTuning } from '../../types/game/flightControl';
import { asScaleNum } from '../edit/sceneEditMerge';
import { DynamicAmbience } from '../world/DynamicAmbience';
import { EditModeAmbience } from '../edit/EditModeAmbience';
import { SceneEditorGizmo } from '../edit/SceneEditorGizmo';
import { FollowCamera } from '../camera/FollowCamera';
import { PathDebugLayer } from '../poli/PathDebugLayer';
import { ExteriorLayer } from './ExteriorLayer';
import { LaunchTunnel } from './LaunchTunnel';
import { FlightController } from './FlightController';
import { FlightCamera } from './FlightCamera';
import { BaseFlightCraftEditable } from './BaseFlightCraftEditable';
import { BASE_CRAFT_KEY } from './baseCraftKey';
import { FlightPreviewController } from './FlightPreviewController';
import { FlightCuePreview } from './FlightCuePreview';
import { FlightCuePlayController } from './FlightCuePlayController';
import { FlightLegCameraGizmo } from './FlightLegCameraGizmo';
import { FlightAudioHost } from '../audio/FlightAudioHost';
import { useFlightPreviewStore } from '../../stores/game/flightPreviewStore';
import { FLIGHT_PATH_ID } from '../../data/game/flightPath';
import { offsetFromWorldPosition } from './flightTimelineTransforms';
import { upsertFlightTimeKeyframe } from './flightTimeTracks';
import type { FlightTimelineKeyframe } from '../../types/game/flightTimeline';

const RAD2DEG = 180 / Math.PI;

// Open-flight scene (LAUNCH_TUNNEL → BASE_FLY_AROUND → CLOUD_ASCENT). Reuses the kit ambience/sky + gizmo.
// PLAY: flight controller + flight camera + Bloom; the launch tunnel shows during LAUNCH_TUNNEL.
// EDIT: orbit camera + gizmo so the exterior/navpoints + the base-loop nodes + the selectable craft are
// editable (flight suspended). The craft gizmo bakes into flight tuning (flyAroundCraftOffset/Yaw/Scale).
export const FlightScene = () => {
  const editMode = useUiStore((s) => s.editMode);
  const phase = useGameStore((s) => s.phase);
  const tuning = useEditorFlightStore((s) => s.tuning);
  const previewFlightCam = useFlightPreviewStore((s) => (s.playing || s.u > 0.001) && s.cameraMode === 'flight');

  const bakeCraft = useCallback((key: string) => {
    if (key !== BASE_CRAFT_KEY) return;
    const ov = useSceneEditStore.getState().overrides[key];
    if (!ov) return;
    const u = useFlightPreviewStore.getState().u;
    const patch: Partial<FlightTuning> = {};
    const frame: Omit<FlightTimelineKeyframe, 'u'> = {};
    if (ov.position) frame.position = offsetFromWorldPosition(FLIGHT_PATH_ID, 'forward', u, ov.position);
    if (ov.rotation) frame.rotation = [ov.rotation[0] * RAD2DEG, ov.rotation[1] * RAD2DEG, ov.rotation[2] * RAD2DEG];
    if (ov.scale !== undefined) frame.scale = asScaleNum(ov.scale) ?? undefined;
    patch.flyAroundTimeTracks = upsertFlightTimeKeyframe(useEditorFlightStore.getState().tuning.flyAroundTimeTracks, { kind: 'craft' }, u, frame);
    useEditorFlightStore.getState().update(patch);
    useSceneEditStore.getState().setOverride(key, { position: undefined, rotation: undefined, scale: undefined });
  }, []);
  const writeCraftKey = useCallback((key: string) => {
    if (key !== BASE_CRAFT_KEY) return;
    const ov = useSceneEditStore.getState().overrides[key];
    if (!ov) return;
    const u = useFlightPreviewStore.getState().u;
    const frame: Omit<FlightTimelineKeyframe, 'u'> = {};
    if (ov.position) frame.position = offsetFromWorldPosition(FLIGHT_PATH_ID, 'forward', u, ov.position);
    if (ov.rotation) frame.rotation = [ov.rotation[0] * RAD2DEG, ov.rotation[1] * RAD2DEG, ov.rotation[2] * RAD2DEG];
    if (ov.scale !== undefined) frame.scale = asScaleNum(ov.scale) ?? undefined;
    useEditorFlightStore.getState().update({
      flyAroundTimeTracks: upsertFlightTimeKeyframe(useEditorFlightStore.getState().tuning.flyAroundTimeTracks, { kind: 'craft' }, u, frame),
    });
  }, []);

  return (
    <>
      {editMode ? <EditModeAmbience /> : <DynamicAmbience />}

      <ExteriorLayer />
      {/* Flight route line + draggable node handles are EDIT-ONLY (no coloured guide line during play). */}
      {editMode && <PathDebugLayer areaId="exterior" />}
      {editMode && <BaseFlightCraftEditable />}
      {editMode && <FlightPreviewController pathId={FLIGHT_PATH_ID} craftScale={tuning.flyAroundCraftScale} craftYaw={tuning.flyAroundCraftYawDeg} fallbackOffset={tuning.flyAroundCraftOffset} timeTracks={tuning.flyAroundTimeTracks} showCraft={false} />}
      {editMode && <FlightCuePreview pathId={FLIGHT_PATH_ID} />}
      {editMode && <FlightLegCameraGizmo />}
      {!editMode && phase === 'LAUNCH_TUNNEL' && <LaunchTunnel />}
      {!editMode && <FlightController />}
      {!editMode && <FlightCuePlayController pathId={FLIGHT_PATH_ID} />}
      {!editMode && <FlightAudioHost />}

      {/* EDIT: orbit camera, unless previewing with Camera = Flight (then show the real flight framing so the
          authored cam distance/height + craft scale are visible live). PLAY: always the flight camera. */}
      {!editMode ? <FlightCamera /> : previewFlightCam ? <FlightCamera /> : <FollowCamera />}
      {editMode && <SceneEditorGizmo onCommit={bakeCraft} onChange={writeCraftKey} />}

      {!editMode && (
        <EffectComposer>
          <Bloom intensity={0.7} luminanceThreshold={0.55} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
};

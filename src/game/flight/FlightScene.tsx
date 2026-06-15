import { useEffect } from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useUiStore } from '../../stores/uiStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { useFlightPhaseStore, setActivePhaseForGamePhase } from '../../stores/game/flightPhaseStore';
import { useFlightTimelineStore } from '../../stores/game/flightTimelineStore';
import { DynamicAmbience } from '../world/DynamicAmbience';
import { EditModeAmbience } from '../edit/EditModeAmbience';
import { SceneEditorGizmo } from '../edit/SceneEditorGizmo';
import { FollowCamera } from '../camera/FollowCamera';
import { ExteriorLayer } from './ExteriorLayer';
import { LaunchTunnel } from './LaunchTunnel';
import { FlightController } from './FlightController';
import { FlightCamera } from './FlightCamera';
import { FlightAudioHost } from '../audio/FlightAudioHost';
import { FlightPathGizmoLayer } from './FlightPathGizmoLayer';
import { FlightPhasePreviewController } from './FlightPhasePreviewController';
import { FlightPhaseCameraController } from './FlightPhaseCameraController';
import { FlightPhaseEventRuntime } from './FlightPhaseEventRuntime';
import { FlightEditorViewController } from './FlightEditorViewController';

// Open-flight scene (LAUNCH_TUNNEL → BASE_FLY_AROUND → CLOUD_ASCENT).
// EDIT: orbit camera + the new Flight Phase editor — draggable path-node gizmos, a timeline-driven preview
// craft (scrub the bottom-left overlay to any second), camera-keyframe gizmos, view presets, and camera/event
// preview. The kit SceneEditorGizmo stays for the exterior set-pieces.
// PLAY: LAUNCH_TUNNEL + CLOUD_ASCENT keep the free-flight controller; BASE_FLY_AROUND is the authored cinematic
// — the craft flies the base-orbit path on its seconds timeline, the authored camera keyframes frame it, and
// timeline events fire (the seeded nextPhase event advances to CLOUD_ASCENT).
export const FlightScene = () => {
  const editMode = useUiStore((s) => s.editMode);
  const phase = useGameStore((s) => s.phase);
  const cameraPreview = useFlightTimelineStore((s) => s.cameraPreview);
  const hasCameraKeys = useFlightPhaseStore((s) => {
    const p = s.phases.find((x) => x.phaseId === s.activePhaseId) ?? s.phases[0];
    return (p?.cameraKeyframes.length ?? 0) > 0;
  });
  const baseOrbit = phase === 'BASE_FLY_AROUND';
  // Bind the editor/runtime to the base-orbit Flight Phase whenever this scene is mounted.
  useEffect(() => { setActivePhaseForGamePhase('BASE_FLY_AROUND'); }, []);

  return (
    <>
      {editMode ? <EditModeAmbience /> : <DynamicAmbience />}
      <ExteriorLayer />

      {/* EDIT — Flight Phase authoring */}
      {editMode && <FlightPathGizmoLayer />}
      {editMode && <FlightPhasePreviewController />}
      {editMode && <FlightPhaseEventRuntime />}
      {editMode && <FlightEditorViewController />}
      {editMode && (cameraPreview && hasCameraKeys ? <FlightPhaseCameraController /> : <FollowCamera />)}
      {editMode && <SceneEditorGizmo />}

      {/* PLAY — BASE_FLY_AROUND is GUIDED along the authored path (W/S throttle + A/D steer), so editing nodes
          changes the real flown route; the authored camera keyframes + events ride the same progress. The other
          flight phases keep the free-flight FlightController (LAUNCH_TUNNEL sprint, CLOUD_ASCENT climb). */}
      {!editMode && phase === 'LAUNCH_TUNNEL' && <LaunchTunnel />}
      {!editMode && baseOrbit && <FlightPhasePreviewController play />}
      {!editMode && baseOrbit && <FlightPhaseEventRuntime play />}
      {!editMode && !baseOrbit && <FlightController />}
      {!editMode && (baseOrbit && hasCameraKeys ? <FlightPhaseCameraController /> : <FlightCamera />)}
      {!editMode && <FlightAudioHost />}

      {!editMode && (
        <EffectComposer>
          <Bloom intensity={0.7} luminanceThreshold={0.55} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
};

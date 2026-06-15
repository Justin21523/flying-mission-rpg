import { useEffect } from 'react';
import { useUiStore } from '../../../stores/uiStore';
import { useGameStore } from '../../../stores/game/useGameStore';
import { EditModeAmbience } from '../../edit/EditModeAmbience';
import { WorldFlightEnvironment } from './WorldFlightEnvironment';
import { SceneEditorGizmo } from '../../edit/SceneEditorGizmo';
import { FollowCamera } from '../../camera/FollowCamera';
import { FlightCamera } from '../FlightCamera';
import { CloudField } from './CloudField';
import { SpeedField } from './SpeedField';
import { CloudBreakEffect } from '../effects/CloudBreakEffect';
import { FlightAudioHost } from '../../audio/FlightAudioHost';
import { FlightEventDirectorHost } from './FlightEventDirectorHost';
import { FlightEventRenderer } from './FlightEventRenderer';
import { FlightCelebrationLayer } from './FlightCelebrationLayer';
import { clearActiveFlightEvents } from './flightEventRuntime';
import { useWorldFlightRuntimeStore } from '../../../stores/game/worldFlightRuntimeStore';
import { useFlightScoreStore } from '../../../stores/game/flightScoreStore';
import { FlightPathGizmoLayer } from '../FlightPathGizmoLayer';
import { FlightPhasePreviewController } from '../FlightPhasePreviewController';
import { FlightPhaseCameraController } from '../FlightPhaseCameraController';
import { FlightPhaseEventRuntime } from '../FlightPhaseEventRuntime';
import { FlightEditorViewController } from '../FlightEditorViewController';
import { setActivePhaseForGamePhase, useFlightPhaseStore } from '../../../stores/game/flightPhaseStore';
import { useFlightTimelineStore } from '../../../stores/game/flightTimelineStore';

// WORLD_FLIGHT / RETURN_FLIGHT — the long-distance "aerial cruise / mission-travel" leg, now on the UNIFIED
// Flight Editor + guided runtime (same as base orbit). EDIT: draggable path-node gizmos + timeline scrubber +
// camera/event tracks for THIS leg's Flight Phase (bound by FSM phase). PLAY: the craft flies the authored
// aerial path (guided: W/S throttle, A/D steer) and publishes flightHandle, so the gameplay subsystems
// (sky/clouds · speed FX · event director + renderer · celebration · audio) keep working; reaching the end
// hands off to DESTINATION_APPROACH (or BASE_APPROACH on the return leg).
export const WorldFlightScene = () => {
  const editMode = useUiStore((s) => s.editMode);
  const phase = useGameStore((s) => s.phase);
  const cameraPreview = useFlightTimelineStore((s) => s.cameraPreview);
  const hasCameraKeys = useFlightPhaseStore((s) => {
    const p = s.phases.find((x) => x.phaseId === s.activePhaseId) ?? s.phases[0];
    return (p?.cameraKeyframes.length ?? 0) > 0;
  });

  // Bind the editor/runtime to this leg's Flight Phase (aerial cruise for WORLD_FLIGHT, return for RETURN_FLIGHT).
  useEffect(() => { setActivePhaseForGamePhase(phase); }, [phase]);
  useEffect(() => () => {
    clearActiveFlightEvents();
    useWorldFlightRuntimeStore.getState().reset();
    useFlightScoreStore.getState().reset();
  }, []);

  return (
    <>
      {editMode ? <EditModeAmbience /> : <WorldFlightEnvironment />}

      {/* EDIT — unified Flight Editor (identical tools to base orbit). */}
      {editMode && <FlightPathGizmoLayer />}
      {editMode && <FlightPhasePreviewController />}
      {editMode && <FlightPhaseEventRuntime />}
      {editMode && <FlightEditorViewController />}
      {/* Camera preview ON → exactly the Play camera (authored keyframes, else third-person follow); OFF →
          the free editor orbit camera. */}
      {editMode && (cameraPreview ? (hasCameraKeys ? <FlightPhaseCameraController /> : <FlightCamera />) : <FollowCamera />)}
      {editMode && <SceneEditorGizmo />}

      {/* PLAY — guided along the authored aerial path; gameplay decoration/events keep running off flightHandle. */}
      {!editMode && <FlightPhasePreviewController play />}
      {!editMode && <FlightPhaseEventRuntime play />}
      {!editMode && <CloudField />}
      {!editMode && <SpeedField />}
      {!editMode && <CloudBreakEffect />}
      {!editMode && <FlightEventDirectorHost />}
      {!editMode && <FlightEventRenderer />}
      {!editMode && <FlightCelebrationLayer />}
      {!editMode && <FlightAudioHost />}
      {!editMode && (hasCameraKeys ? <FlightPhaseCameraController /> : <FlightCamera />)}
    </>
  );
};

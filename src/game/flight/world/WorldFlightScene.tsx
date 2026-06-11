import { useEffect } from 'react';
import { useUiStore } from '../../../stores/uiStore';
import { EditModeAmbience } from '../../edit/EditModeAmbience';
import { WorldFlightEnvironment } from './WorldFlightEnvironment';
import { SceneEditorGizmo } from '../../edit/SceneEditorGizmo';
import { FollowCamera } from '../../camera/FollowCamera';
import { PathDebugLayer } from '../../poli/PathDebugLayer';
import { FlightCamera } from '../FlightCamera';
import { RouteFollower } from './RouteFollower';
import { CloudField } from './CloudField';
import { SpeedField } from './SpeedField';
import { FlightEventDirectorHost } from './FlightEventDirectorHost';
import { FlightEventRenderer } from './FlightEventRenderer';
import { FlightEventPreview } from './FlightEventPreview';
import { WorldFlightDebugGizmos } from './WorldFlightDebugGizmos';
import { clearActiveFlightEvents } from './flightEventRuntime';
import { useWorldFlightRuntimeStore } from '../../../stores/game/worldFlightRuntimeStore';

// WORLD_FLIGHT — the long-distance high-altitude leg (PDF §批次5), split into layers:
//   ambience (WorldFlightEnvironment / WorldSkyAmbience) · route geometry (PathDebugLayer, area 'world') ·
//   the craft (RouteFollower) · cloud carpet + speed streaks (instanced, recycled) · the event DIRECTOR
//   (FlightEventDirectorHost, logic) + RENDERER (FlightEventRenderer, view) · FlightCamera.
// PLAY runs the full system; EDIT shows the orbit camera + gizmo + the route's event-pool gallery + segment
// debug gizmos so everything is editable in place (🧭/🌩/🌦/🛣) and synced. All runtime is disposed on exit.
export const WorldFlightScene = () => {
  const editMode = useUiStore((s) => s.editMode);

  useEffect(() => {
    // Dispose everything when leaving WORLD_FLIGHT (no residual events / state).
    return () => {
      clearActiveFlightEvents();
      useWorldFlightRuntimeStore.getState().reset();
    };
  }, []);

  return (
    <>
      {/* EDIT MODE is always a clear, flat-bright view (POLI principle) — no sky dome / fog so authoring is
          unobstructed. PLAY uses the per-route sky. */}
      {editMode ? <EditModeAmbience /> : <WorldFlightEnvironment />}

      {/* The route line + draggable node handles are EDIT-ONLY (no coloured guide line during play). */}
      {editMode && <PathDebugLayer areaId="world" />}

      {!editMode && (
        <>
          <RouteFollower />
          <CloudField />
          <SpeedField />
          <FlightEventDirectorHost />
          <FlightEventRenderer />
        </>
      )}

      {/* Edit Mode: route event-pool gallery + segment-band gizmos (same visuals as play). */}
      {editMode && (
        <>
          <FlightEventPreview />
          <WorldFlightDebugGizmos />
        </>
      )}

      {editMode ? <FollowCamera /> : <FlightCamera />}
      {editMode && <SceneEditorGizmo />}
    </>
  );
};

import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useUiStore } from '../../../stores/uiStore';
import { EditModeAmbience } from '../../edit/EditModeAmbience';
import { WorldSkyAmbience } from './WorldSkyAmbience';
import { SceneEditorGizmo } from '../../edit/SceneEditorGizmo';
import { FollowCamera } from '../../camera/FollowCamera';
import { PathDebugLayer } from '../../poli/PathDebugLayer';
import { FlightCamera } from '../FlightCamera';
import { RouteFollower } from './RouteFollower';
import { CloudField } from './CloudField';
import { SpeedField } from './SpeedField';
import { FlightEventLayer } from './FlightEventLayer';
import { FlightEventPreview } from './FlightEventPreview';

// WORLD_FLIGHT — the long-distance high-altitude leg (PDF §批次5). PLAY: the craft follows the route's
// 航道 (RouteFollower) through a recycled cloud field + speed streaks, with the pooled flight-event
// director spawning events ahead; FlightCamera + Bloom. EDIT: orbit camera + gizmo + the world route's
// node handles (PathDebugLayer area 'world') so the route is editable in the 🛣 Tracks tab — flight
// suspended, fully synced with play.
export const WorldFlightScene = () => {
  const editMode = useUiStore((s) => s.editMode);

  return (
    <>
      {editMode ? <EditModeAmbience /> : <WorldSkyAmbience />}

      {/* World route line + draggable node handles (Tracks tab edits these; synced in play). */}
      <PathDebugLayer areaId="world" />

      {!editMode && (
        <>
          <RouteFollower />
          <CloudField />
          <SpeedField />
          <FlightEventLayer />
        </>
      )}

      {/* Edit Mode: show the route's whole event pool laid out along the 航道 (same visuals as play). */}
      {editMode && <FlightEventPreview />}

      {editMode ? <FollowCamera /> : <FlightCamera />}
      {editMode && <SceneEditorGizmo />}

      {!editMode && (
        <EffectComposer>
          <Bloom intensity={0.8} luminanceThreshold={0.5} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
};

import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useUiStore } from '../../stores/uiStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { DynamicAmbience } from '../world/DynamicAmbience';
import { EditModeAmbience } from '../edit/EditModeAmbience';
import { SceneEditorGizmo } from '../edit/SceneEditorGizmo';
import { FollowCamera } from '../camera/FollowCamera';
import { PathDebugLayer } from '../poli/PathDebugLayer';
import { ExteriorLayer } from './ExteriorLayer';
import { LaunchTunnel } from './LaunchTunnel';
import { FlightController } from './FlightController';
import { FlightCamera } from './FlightCamera';

// Open-flight scene (LAUNCH_TUNNEL → BASE_FLY_AROUND → CLOUD_ASCENT). Reuses the kit ambience/sky +
// gizmo. PLAY: flight controller + flight camera + Bloom; the launch tunnel shows during LAUNCH_TUNNEL.
// EDIT: orbit camera + gizmo so the exterior/navpoints are editable (flight suspended).
export const FlightScene = () => {
  const editMode = useUiStore((s) => s.editMode);
  const phase = useGameStore((s) => s.phase);

  return (
    <>
      {editMode ? <EditModeAmbience /> : <DynamicAmbience />}

      <ExteriorLayer />
      {/* Flight route: POLI path line (play guidance) + draggable node handles (edit). Tracks tab edits nodes. */}
      <PathDebugLayer areaId="exterior" />
      {!editMode && phase === 'LAUNCH_TUNNEL' && <LaunchTunnel />}
      {!editMode && <FlightController />}

      {editMode ? <FollowCamera /> : <FlightCamera />}
      {editMode && <SceneEditorGizmo />}

      {!editMode && (
        <EffectComposer>
          <Bloom intensity={0.7} luminanceThreshold={0.55} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
};

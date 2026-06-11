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
import { BASE_CRAFT_KEY, baseLoopStartNode } from './baseCraftKey';

const RAD2DEG = 180 / Math.PI;

// Open-flight scene (LAUNCH_TUNNEL → BASE_FLY_AROUND → CLOUD_ASCENT). Reuses the kit ambience/sky + gizmo.
// PLAY: flight controller + flight camera + Bloom; the launch tunnel shows during LAUNCH_TUNNEL.
// EDIT: orbit camera + gizmo so the exterior/navpoints + the base-loop nodes + the selectable craft are
// editable (flight suspended). The craft gizmo bakes into flight tuning (flyAroundCraftOffset/Yaw/Scale).
export const FlightScene = () => {
  const editMode = useUiStore((s) => s.editMode);
  const phase = useGameStore((s) => s.phase);

  const bakeCraft = useCallback((key: string) => {
    if (key !== BASE_CRAFT_KEY) return;
    const ov = useSceneEditStore.getState().overrides[key];
    if (!ov) return;
    const start = baseLoopStartNode();
    const patch: Partial<FlightTuning> = {};
    if (ov.position) patch.flyAroundCraftOffset = [ov.position[0] - start[0], ov.position[1] - start[1], ov.position[2] - start[2]];
    if (ov.rotation) patch.flyAroundCraftYawDeg = ov.rotation[1] * RAD2DEG;
    if (ov.scale !== undefined) patch.flyAroundCraftScale = asScaleNum(ov.scale);
    useEditorFlightStore.getState().update(patch);
    useSceneEditStore.getState().setOverride(key, { position: undefined, rotation: undefined, scale: undefined });
  }, []);

  return (
    <>
      {editMode ? <EditModeAmbience /> : <DynamicAmbience />}

      <ExteriorLayer />
      {/* Flight route line + draggable node handles are EDIT-ONLY (no coloured guide line during play). */}
      {editMode && <PathDebugLayer areaId="exterior" />}
      {editMode && <BaseFlightCraftEditable />}
      {!editMode && phase === 'LAUNCH_TUNNEL' && <LaunchTunnel />}
      {!editMode && <FlightController />}

      {editMode ? <FollowCamera /> : <FlightCamera />}
      {editMode && <SceneEditorGizmo onCommit={bakeCraft} />}

      {!editMode && (
        <EffectComposer>
          <Bloom intensity={0.7} luminanceThreshold={0.55} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
};

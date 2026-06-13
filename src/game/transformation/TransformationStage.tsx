import { useCallback, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@react-three/drei';
import { useUiStore } from '../../stores/uiStore';
import { cameraFocus } from '../edit/cameraFocus';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import { SceneEditorGizmo } from '../edit/SceneEditorGizmo';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { useEditorTransformationStore, getEditorTransformations } from '../../stores/game/editorTransformationStore';
import { useTransformationPreviewStore } from '../../stores/game/transformationPreviewStore';
import { txFrame } from './transformationRuntime';
import { TransformationBackdrop } from './TransformationBackdrop';
import { TransformationCharacterPresenter } from './TransformationCharacterPresenter';
import { TransformationCameraController } from './TransformationCameraController';
import { TransformationEffects } from './TransformationEffects';
import { PoseSwitchFxLayer } from '../characters/PoseSwitchFxLayer';
import { TransformationDirector } from './TransformationDirector';
import { TransformationPreviewController } from './TransformationPreviewController';
import { TransformationDebugGizmos } from './TransformationDebugGizmos';
import { mergeTransformationOverrides, bakeOverrideToDef } from './transformationOverrides';
import { applyTransformationTimeTracks, keyframeForTarget, targetFromTransformationKey, upsertTimeKeyframe } from './transformationTimeTracks';
import type { TransformationDefinition } from '../../types/game/transformation';

// The TRANSFORMATION scene (phase TRANSFORMATION). PLAY: TransformationDirector drives the runner + form
// controller + state-machine exit. EDIT: the preview controller drives the runner from the ✨ Transform
// Preview controls. Both share the backdrop / presenter / camera / effects (read txFrame) → edit/play parity.
function findTimeline(timelines: TransformationDefinition[], characterId: string | null, transformationId?: string): TransformationDefinition | undefined {
  return (transformationId && timelines.find((t) => t.id === transformationId)) || timelines.find((t) => t.characterId === characterId) || timelines[0];
}

const _focusOff = new Vector3();
// Orbit camera for transformation edit — also consumes the focusCameraOn bus so the tab's 🎯 Focus buttons
// pan to a part/model anchor (keeping the current view offset), like FollowCamera does in the other scenes.
const TransformationEditOrbitCamera = () => {
  const ref = useRef<OrbitControlsImpl>(null);
  const lastFocus = useRef(cameraFocus.fireId);
  useFrame((state) => {
    const c = ref.current;
    if (!c || cameraFocus.fireId === lastFocus.current) return;
    lastFocus.current = cameraFocus.fireId;
    _focusOff.copy(state.camera.position).sub(c.target);
    c.target.set(cameraFocus.x, cameraFocus.y, cameraFocus.z);
    state.camera.position.copy(c.target).add(_focusOff);
    c.update();
  });
  return <OrbitControls ref={ref} makeDefault target={[0, 0.7, 0]} enablePan enableZoom minDistance={0.5} maxDistance={80} enableDamping dampingFactor={0.1} />;
};

export const TransformationStage = () => {
  const editMode = useUiStore((s) => s.editMode);
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const previewId = useTransformationPreviewStore((s) => s.timelineId);
  const previewTime = useTransformationPreviewStore((s) => s.time);
  const previewPlaying = useTransformationPreviewStore((s) => s.playing);
  const previewCamera = useTransformationPreviewStore((s) => s.previewCamera);
  useEditorTransformationStore((s) => s.items); // reactive to edits
  const timelines = getEditorTransformations();

  let def: TransformationDefinition | undefined;
  let charModelId: string | undefined;
  if (editMode) {
    def = timelines.find((t) => t.id === previewId) ?? timelines[0];
    const ch = def?.characterId ? getEditorCharacter(def.characterId) : undefined;
    charModelId = ch?.modelAssetId;
  } else {
    const character = charId ? getEditorCharacter(charId) : undefined;
    def = findTimeline(timelines, charId, character?.transformationId);
    charModelId = character?.modelAssetId;
  }

  const overrides = useSceneEditStore((s) => s.overrides);
  const editDef = def;
  const editDefAtTime = editDef && editMode ? applyTransformationTimeTracks(editDef, previewTime) : editDef;
  if (def) def = mergeTransformationOverrides(def, overrides);

  useEffect(() => {
    txFrame.charModelId = charModelId;
  }, [charModelId]);

  // On a finished gizmo drag, bake the override into the authored TransformationDefinition (modelSlotOffsets /
  // part base / stage modelOffset) and clear the sceneEditStore override — so offsets live in authored data.
  const writeTimeKey = useCallback((key: string, clearOverride: boolean) => {
    const target = editDef;
    if (!target) return;
    const latest = getEditorTransformations().find((timeline) => timeline.id === target.id) ?? target;
    const ov = useSceneEditStore.getState().overrides[key];
    if (!ov) return;
    const trackTarget = targetFromTransformationKey(latest, key);
    if (trackTarget) {
      const frame = keyframeForTarget(latest, trackTarget, ov);
      if (frame) {
        const { time: _unusedTime, ...payload } = frame;
        void _unusedTime;
        useEditorTransformationStore.getState().update(latest.id, {
          timeTracks: upsertTimeKeyframe(latest.timeTracks, trackTarget, useTransformationPreviewStore.getState().time, payload),
        });
      }
      if (clearOverride) useSceneEditStore.getState().setOverride(key, { position: undefined, rotation: undefined, scale: undefined });
      return;
    }
    const patch = bakeOverrideToDef(latest, key, ov);
    if (!patch) return; // not a transformation key — leave it to its own owner
    useEditorTransformationStore.getState().update(latest.id, patch);
    if (clearOverride) useSceneEditStore.getState().setOverride(key, { position: undefined, rotation: undefined, scale: undefined });
  }, [editDef]);
  const bakeKey = useCallback((key: string) => writeTimeKey(key, true), [writeTimeKey]);
  const updateKey = useCallback((key: string) => writeTimeKey(key, false), [writeTimeKey]);

  if (!def) return null;
  const presenterDef = editMode ? applyTransformationTimeTracks(def, previewTime) : def;

  return (
    <>
      <TransformationBackdrop backdropColor={def.backdropColor} glowColor={def.particleColor} />
      <TransformationCharacterPresenter def={presenterDef} editDef={editDefAtTime} editMode={editMode} charModelId={charModelId} />
      {editMode && !previewPlaying && !previewCamera ? <TransformationEditOrbitCamera /> : <TransformationCameraController />}
      <TransformationEffects />
      <PoseSwitchFxLayer />
      {editMode ? (
        <>
          <TransformationPreviewController def={def} />
          <TransformationDebugGizmos def={editDefAtTime ?? def} />
          <SceneEditorGizmo onCommit={bakeKey} onChange={updateKey} />
        </>
      ) : (
        <TransformationDirector />
      )}
    </>
  );
};

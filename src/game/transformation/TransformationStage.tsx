import { useCallback, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useUiStore } from '../../stores/uiStore';
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
import { TransformationDirector } from './TransformationDirector';
import { TransformationPreviewController } from './TransformationPreviewController';
import { TransformationDebugGizmos } from './TransformationDebugGizmos';
import { mergeTransformationOverrides, bakeOverrideToDef } from './transformationOverrides';
import type { TransformationDefinition } from '../../types/game/transformation';

// The TRANSFORMATION scene (phase TRANSFORMATION). PLAY: TransformationDirector drives the runner + form
// controller + state-machine exit. EDIT: the preview controller drives the runner from the ✨ Transform
// Preview controls. Both share the backdrop / presenter / camera / effects (read txFrame) → edit/play parity.
function findTimeline(timelines: TransformationDefinition[], characterId: string | null, transformationId?: string): TransformationDefinition | undefined {
  return (transformationId && timelines.find((t) => t.id === transformationId)) || timelines.find((t) => t.characterId === characterId) || timelines[0];
}

const TransformationEditOrbitCamera = () => (
  <OrbitControls makeDefault target={[0, 0.7, 0]} enablePan enableZoom minDistance={0.5} maxDistance={80} enableDamping dampingFactor={0.1} />
);

export const TransformationStage = () => {
  const editMode = useUiStore((s) => s.editMode);
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const previewId = useTransformationPreviewStore((s) => s.timelineId);
  const previewPlaying = useTransformationPreviewStore((s) => s.playing);
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
  if (def) def = mergeTransformationOverrides(def, overrides);

  useEffect(() => {
    txFrame.charModelId = charModelId;
  }, [charModelId]);

  // On a finished gizmo drag, bake the override into the authored TransformationDefinition (modelSlotOffsets /
  // part base / stage modelOffset) and clear the sceneEditStore override — so offsets live in authored data.
  const bakeKey = useCallback((key: string) => {
    const target = editDef;
    if (!target) return;
    const ov = useSceneEditStore.getState().overrides[key];
    if (!ov) return;
    const patch = bakeOverrideToDef(target, key, ov);
    if (!patch) return; // not a transformation key — leave it to its own owner
    useEditorTransformationStore.getState().update(target.id, patch);
    useSceneEditStore.getState().setOverride(key, { position: undefined, rotation: undefined, scale: undefined });
  }, [editDef]);

  if (!def) return null;

  return (
    <>
      <TransformationBackdrop backdropColor={def.backdropColor} glowColor={def.particleColor} />
      <TransformationCharacterPresenter def={def} editDef={editDef} editMode={editMode} previewPlaying={previewPlaying} charModelId={charModelId} />
      {editMode && !previewPlaying ? <TransformationEditOrbitCamera /> : <TransformationCameraController />}
      <TransformationEffects />
      {editMode ? (
        <>
          <TransformationPreviewController def={def} />
          <TransformationDebugGizmos def={editDef ?? def} />
          <SceneEditorGizmo onCommit={bakeKey} />
        </>
      ) : (
        <TransformationDirector />
      )}
    </>
  );
};

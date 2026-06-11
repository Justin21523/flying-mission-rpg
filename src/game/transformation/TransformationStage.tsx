import { useEffect } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import { SceneEditorGizmo } from '../edit/SceneEditorGizmo';
import { transformPartKey } from './transformPartKey';
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
import type { TransformationDefinition } from '../../types/game/transformation';

// The TRANSFORMATION scene (phase TRANSFORMATION). PLAY: TransformationDirector drives the runner + form
// controller + state-machine exit. EDIT: the preview controller drives the runner from the ✨ Transform
// Preview controls. Both share the backdrop / presenter / camera / effects (read txFrame) → edit/play parity.
function findTimeline(timelines: TransformationDefinition[], characterId: string | null, transformationId?: string): TransformationDefinition | undefined {
  return (transformationId && timelines.find((t) => t.id === transformationId)) || timelines.find((t) => t.characterId === characterId) || timelines[0];
}

export const TransformationStage = () => {
  const editMode = useUiStore((s) => s.editMode);
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const previewId = useTransformationPreviewStore((s) => s.timelineId);
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

  // EDIT: merge the gizmo-dragged part-anchor overrides into the def so the preview + tab follow the drag
  // live (the Parts sub-tab bakes them into the store, like the other layout tabs).
  const overrides = useSceneEditStore((s) => s.overrides);
  if (editMode && def) {
    def = {
      ...def,
      parts: (def.parts ?? []).map((p) => {
        const ov = overrides[transformPartKey(def!.id, p.key)]?.position as [number, number, number] | undefined;
        return ov ? { ...p, basePosition: ov } : p;
      }),
    };
  }

  useEffect(() => {
    txFrame.charModelId = charModelId;
  }, [charModelId]);

  if (!def) return null;

  return (
    <>
      <TransformationBackdrop backdropColor={def.backdropColor} glowColor={def.particleColor} />
      <TransformationCharacterPresenter def={def} charModelId={charModelId} />
      <TransformationCameraController />
      <TransformationEffects />
      {editMode ? (
        <>
          <TransformationPreviewController def={def} />
          <TransformationDebugGizmos def={def} />
          <SceneEditorGizmo />
        </>
      ) : (
        <TransformationDirector />
      )}
    </>
  );
};

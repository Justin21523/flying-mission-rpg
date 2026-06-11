import { useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useUiStore } from '../../stores/uiStore';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import { SceneEditorGizmo } from '../edit/SceneEditorGizmo';
import { asScaleVec, type EditOverride, type Vec3 } from '../edit/sceneEditMerge';
import { transformModelSlotKey, transformPartKey, transformStageModelKey } from './transformPartKey';
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
import { MODEL_SLOTS, type TransformationDefinition, type TransformationTransformOffset } from '../../types/game/transformation';

// The TRANSFORMATION scene (phase TRANSFORMATION). PLAY: TransformationDirector drives the runner + form
// controller + state-machine exit. EDIT: the preview controller drives the runner from the ✨ Transform
// Preview controls. Both share the backdrop / presenter / camera / effects (read txFrame) → edit/play parity.
function findTimeline(timelines: TransformationDefinition[], characterId: string | null, transformationId?: string): TransformationDefinition | undefined {
  return (transformationId && timelines.find((t) => t.id === transformationId)) || timelines.find((t) => t.characterId === characterId) || timelines[0];
}

const RAD2DEG = 180 / Math.PI;
const DEFAULT_OFFSET: TransformationTransformOffset = { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 };

function scaleNumber(scale: EditOverride['scale']): number | undefined {
  if (scale === undefined) return undefined;
  if (typeof scale === 'number') return scale;
  const v = asScaleVec(scale);
  return (v[0] + v[1] + v[2]) / 3;
}

function radiansToDegrees(rotation: Vec3): Vec3 {
  return [rotation[0] * RAD2DEG, rotation[1] * RAD2DEG, rotation[2] * RAD2DEG];
}

function mergeOffset(base: TransformationTransformOffset | undefined, override: EditOverride | undefined): TransformationTransformOffset {
  const source = base ?? DEFAULT_OFFSET;
  return {
    position: override?.position ?? source.position,
    rotation: override?.rotation ? radiansToDegrees(override.rotation) : source.rotation,
    scale: scaleNumber(override?.scale) ?? source.scale,
  };
}

function mergeTransformationOverrides(def: TransformationDefinition, overrides: Record<string, EditOverride>): TransformationDefinition {
  const modelSlotOffsets = { ...(def.modelSlotOffsets ?? {}) };
  for (const slot of MODEL_SLOTS) {
    modelSlotOffsets[slot] = mergeOffset(def.modelSlotOffsets?.[slot], overrides[transformModelSlotKey(def.id, slot)]);
  }
  return {
    ...def,
    modelSlotOffsets,
    parts: (def.parts ?? []).map((p) => {
      const ov = overrides[transformPartKey(def.id, p.key)];
      return {
        ...p,
        basePosition: ov?.position ?? p.basePosition,
        baseRotation: ov?.rotation ? radiansToDegrees(ov.rotation) : p.baseRotation,
        baseScale: scaleNumber(ov?.scale) ?? p.baseScale,
      };
    }),
    stages: def.stages.map((s) => {
      if (s.type !== 'model-swap' || !s.params.modelRef) return s;
      const ov = overrides[transformStageModelKey(def.id, s.id)];
      return { ...s, params: { ...s.params, modelOffset: mergeOffset(s.params.modelOffset, ov) } };
    }),
  };
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

  if (!def) return null;

  return (
    <>
      <TransformationBackdrop backdropColor={def.backdropColor} glowColor={def.particleColor} />
      <TransformationCharacterPresenter def={def} editDef={editDef} editMode={editMode} charModelId={charModelId} />
      {editMode && !previewPlaying ? <TransformationEditOrbitCamera /> : <TransformationCameraController />}
      <TransformationEffects />
      {editMode ? (
        <>
          <TransformationPreviewController def={def} />
          <TransformationDebugGizmos def={editDef ?? def} />
          <SceneEditorGizmo />
        </>
      ) : (
        <TransformationDirector />
      )}
    </>
  );
};

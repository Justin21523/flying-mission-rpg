import { MODEL_SLOTS, type ModelSlot, type TransformationDefinition, type TransformationStage } from '../../types/game/transformation';

export interface StageScrubTimes {
  start: number;
  middle: number;
  end: number;
}

export interface StageTargetDiagnostic {
  label: string;
  modelSlot?: ModelSlot;
  modelRef?: string;
  partKey?: string;
}

export interface StageClipDiagnostic {
  ok: boolean;
  missing: boolean;
  modelId?: string;
  clipName?: string;
  firstValidClip?: string;
  message: string;
}

export interface ModelSlotVisibilityDiagnostic {
  slot: ModelSlot;
  modelId?: string;
  visible: boolean;
  sourceStageId?: string;
}

export function stageScrubTimes(stage: TransformationStage): StageScrubTimes {
  const start = Math.max(0, stage.startTime);
  const duration = Math.max(0, stage.duration);
  return {
    start,
    middle: start + duration * 0.5,
    end: start + duration,
  };
}

export function stageTargetDiagnostic(stage: TransformationStage): StageTargetDiagnostic {
  if (stage.params.modelRef) return { label: `model ${stage.params.modelRef}`, modelRef: stage.params.modelRef };
  if (stage.params.modelSlot) return { label: `${stage.params.modelSlot} slot`, modelSlot: stage.params.modelSlot };
  if (stage.params.partKey) return { label: `${stage.params.partKey} part`, partKey: stage.params.partKey };
  if (stage.type === 'animation-clip') return { label: 'auto animation target' };
  if (stage.type === 'model-move' || stage.type === 'model-visibility' || stage.type === 'model-swap') return { label: 'robot slot', modelSlot: 'robot' };
  return { label: 'timeline root' };
}

export function stageClipDiagnostic(stage: TransformationStage, modelId: string | undefined, clipNames: readonly string[]): StageClipDiagnostic {
  const clipName = stage.params.clipName;
  if (stage.type !== 'animation-clip') return { ok: true, missing: false, modelId, message: 'Not an animation stage.' };
  if (!modelId) return { ok: !clipName, missing: !!clipName, clipName, message: clipName ? 'Clip target has no resolved model.' : 'No model resolved yet.' };
  if (!clipName) return { ok: true, missing: false, modelId, firstValidClip: clipNames[0], message: 'No clip selected.' };
  const found = clipNames.includes(clipName);
  return {
    ok: found,
    missing: !found,
    modelId,
    clipName,
    firstValidClip: clipNames[0],
    message: found ? 'Clip is available on the resolved model.' : `Clip "${clipName}" is missing on the resolved model.`,
  };
}

export function modelSlotVisibilityDiagnostics(def: TransformationDefinition, modelForSlot: (slot: ModelSlot) => string | undefined): ModelSlotVisibilityDiagnostic[] {
  return MODEL_SLOTS.map((slot) => {
    let visible = slot === 'robot';
    let sourceStageId: string | undefined;
    for (const stage of def.stages) {
      if (!stage.enabled) continue;
      if ((stage.type === 'model-visibility' || stage.type === 'model-swap') && (stage.params.modelSlot ?? 'robot') === slot && !stage.params.modelRef) {
        visible = stage.params.visible ?? true;
        sourceStageId = stage.id;
      }
    }
    return {
      slot,
      modelId: modelForSlot(slot),
      visible,
      sourceStageId,
    };
  });
}

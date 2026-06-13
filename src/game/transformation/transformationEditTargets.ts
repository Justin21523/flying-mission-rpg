import {
  transformCameraLookKey,
  transformCameraShotKey,
  transformEffectKey,
  transformModelSlotKey,
  transformPartKey,
  transformRootKey,
  transformStageModelKey,
  transformStageMoveKey,
  transformStagePartMoveKey,
} from './transformPartKey';
import { MODEL_SLOTS, type TransformationDefinition } from '../../types/game/transformation';

export type TransformationEditTargetKind = 'root' | 'model-slot' | 'part' | 'stage' | 'effect' | 'camera' | 'unknown';

export interface TransformationEditTarget {
  key: string;
  label: string;
  kind: TransformationEditTargetKind;
  canBake: boolean;
}

export function listTransformationEditTargets(def: TransformationDefinition): TransformationEditTarget[] {
  const targets: TransformationEditTarget[] = [
    { key: transformRootKey(def.id), label: 'Root performance', kind: 'root', canBake: true },
    ...MODEL_SLOTS.map((slot) => ({ key: transformModelSlotKey(def.id, slot), label: `${slot} model slot`, kind: 'model-slot' as const, canBake: true })),
    ...(def.parts ?? []).map((part) => ({ key: transformPartKey(def.id, part.key), label: `${part.key} part`, kind: 'part' as const, canBake: true })),
  ];

  for (const stage of def.stages) {
    if (stage.type === 'model-swap' && stage.params.modelRef) targets.push({ key: transformStageModelKey(def.id, stage.id), label: `${stage.label ?? stage.id} stage model`, kind: 'stage', canBake: true });
    if (stage.type === 'model-move') targets.push({ key: transformStageMoveKey(def.id, stage.id), label: `${stage.label ?? stage.id} model move`, kind: 'stage', canBake: true });
    if (stage.type === 'part-transform') targets.push({ key: transformStagePartMoveKey(def.id, stage.id), label: `${stage.label ?? stage.id} part target`, kind: 'stage', canBake: true });
    if (stage.type === 'camera-shot') {
      targets.push({ key: transformCameraShotKey(def.id, stage.id), label: `${stage.label ?? stage.id} stage camera anchor`, kind: 'camera', canBake: true });
      targets.push({ key: transformCameraLookKey(def.id, stage.id), label: `${stage.label ?? stage.id} stage look target`, kind: 'camera', canBake: true });
    }
  }

  for (const effect of def.effectTracks ?? []) targets.push({ key: transformEffectKey(def.id, effect.id), label: `${effect.type} effect anchor`, kind: 'effect', canBake: true });
  for (const shot of def.cameraShots ?? []) {
    targets.push({ key: transformCameraShotKey(def.id, shot.id), label: `${shot.type} camera anchor`, kind: 'camera', canBake: true });
    targets.push({ key: transformCameraLookKey(def.id, shot.id), label: `${shot.type} look target`, kind: 'camera', canBake: true });
  }
  return targets;
}

export function resolveTransformationEditTarget(def: TransformationDefinition, key: string | null): TransformationEditTarget {
  if (!key) return { key: '', label: 'No selected transform target', kind: 'unknown', canBake: false };
  return listTransformationEditTargets(def).find((target) => target.key === key) ?? { key, label: 'Unknown transform target', kind: 'unknown', canBake: false };
}

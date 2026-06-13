import { asScaleVec, type EditOverride } from '../edit/sceneEditMerge';
import {
  cameraShotAnchor,
  cameraShotFromAnchor,
  liveOffset,
  radiansToDegrees,
  scaleNumber,
  DEFAULT_OFFSET,
} from './transformationOverrides';
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
import {
  MODEL_SLOTS,
  type ModelSlot,
  type TransformationDefinition,
  type TransformationEffectTrack,
  type TransformationPart,
  type TransformationTimeKeyframe,
  type TransformationTimeTrack,
  type TransformationTimeTrackTarget,
  type TransformationTransformOffset,
  type TransformationVec3,
} from '../../types/game/transformation';

export const TRANSFORMATION_KEYFRAME_STEP_SEC = 0.02;
const EPS = 0.0001;

export interface EvaluatedTimeTrack {
  position?: TransformationVec3;
  rotation?: TransformationVec3;
  scale?: number;
}

function roundTime(time: number): number {
  return Math.max(0, Math.round(time / TRANSFORMATION_KEYFRAME_STEP_SEC) * TRANSFORMATION_KEYFRAME_STEP_SEC);
}

function sameTarget(a: TransformationTimeTrackTarget, b: TransformationTimeTrackTarget): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'model-slot': return b.kind === 'model-slot' && a.slot === b.slot;
    case 'part': return b.kind === 'part' && a.partKey === b.partKey;
    case 'stage-model': return b.kind === 'stage-model' && a.stageId === b.stageId;
    case 'stage-move': return b.kind === 'stage-move' && a.stageId === b.stageId;
    case 'stage-part-move': return b.kind === 'stage-part-move' && a.stageId === b.stageId;
    case 'effect': return b.kind === 'effect' && a.effectId === b.effectId;
    case 'camera-shot': return b.kind === 'camera-shot' && a.shotId === b.shotId;
    case 'camera-look': return b.kind === 'camera-look' && a.shotId === b.shotId;
    default: return true;
  }
}

export function timeTrackIdForTarget(target: TransformationTimeTrackTarget): string {
  switch (target.kind) {
    case 'root': return 'root';
    case 'model-slot': return `model-slot:${target.slot}`;
    case 'part': return `part:${target.partKey}`;
    case 'stage-model': return `stage-model:${target.stageId}`;
    case 'stage-move': return `stage-move:${target.stageId}`;
    case 'stage-part-move': return `stage-part-move:${target.stageId}`;
    case 'effect': return `effect:${target.effectId}`;
    case 'camera-shot': return `camera-shot:${target.shotId}`;
    case 'camera-look': return `camera-look:${target.shotId}`;
  }
}

function keySuffix(timelineId: string, key: string): string | null {
  const prefix = `transform#structure#${timelineId}__`;
  return key.startsWith(prefix) ? key.slice(prefix.length) : null;
}

export function targetFromTransformationKey(def: TransformationDefinition, key: string): TransformationTimeTrackTarget | null {
  const suffix = keySuffix(def.id, key);
  if (!suffix) return null;
  if (key === transformRootKey(def.id)) return { kind: 'root' };
  for (const slot of MODEL_SLOTS) if (key === transformModelSlotKey(def.id, slot)) return { kind: 'model-slot', slot };
  for (const part of def.parts ?? []) if (key === transformPartKey(def.id, part.key)) return { kind: 'part', partKey: part.key };
  if (suffix.startsWith('stage_model__')) return { kind: 'stage-model', stageId: suffix.slice('stage_model__'.length) };
  if (suffix.startsWith('stage_move__')) return { kind: 'stage-move', stageId: suffix.slice('stage_move__'.length) };
  if (suffix.startsWith('part_move__')) return { kind: 'stage-part-move', stageId: suffix.slice('part_move__'.length) };
  if (suffix.startsWith('effect__')) return { kind: 'effect', effectId: suffix.slice('effect__'.length) };
  if (suffix.startsWith('camera_shot__')) return { kind: 'camera-shot', shotId: suffix.slice('camera_shot__'.length) };
  if (suffix.startsWith('camera_look__')) return { kind: 'camera-look', shotId: suffix.slice('camera_look__'.length) };
  return null;
}

export function keyForTimeTrackTarget(timelineId: string, target: TransformationTimeTrackTarget): string {
  switch (target.kind) {
    case 'root': return transformRootKey(timelineId);
    case 'model-slot': return transformModelSlotKey(timelineId, target.slot);
    case 'part': return transformPartKey(timelineId, target.partKey);
    case 'stage-model': return transformStageModelKey(timelineId, target.stageId);
    case 'stage-move': return transformStageMoveKey(timelineId, target.stageId);
    case 'stage-part-move': return transformStagePartMoveKey(timelineId, target.stageId);
    case 'effect': return transformEffectKey(timelineId, target.effectId);
    case 'camera-shot': return transformCameraShotKey(timelineId, target.shotId);
    case 'camera-look': return transformCameraLookKey(timelineId, target.shotId);
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec(a: TransformationVec3, b: TransformationVec3, t: number): TransformationVec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function valueAt(
  prev: TransformationTimeKeyframe,
  next: TransformationTimeKeyframe | undefined,
  time: number,
  interpolation: TransformationTimeTrack['interpolation'],
): EvaluatedTimeTrack {
  if (!next || interpolation === 'hold' || next.time <= prev.time + EPS) return { position: prev.position, rotation: prev.rotation, scale: prev.scale };
  const k = Math.max(0, Math.min(1, (time - prev.time) / (next.time - prev.time)));
  return {
    position: prev.position && next.position ? lerpVec(prev.position, next.position, k) : prev.position ?? next.position,
    rotation: prev.rotation && next.rotation ? lerpVec(prev.rotation, next.rotation, k) : prev.rotation ?? next.rotation,
    scale: prev.scale !== undefined && next.scale !== undefined ? lerp(prev.scale, next.scale, k) : prev.scale ?? next.scale,
  };
}

export function evaluateTimeTrack(track: TransformationTimeTrack | undefined, time: number): EvaluatedTimeTrack | undefined {
  const keyframes = (track?.keyframes ?? []).slice().sort((a, b) => a.time - b.time);
  if (!track || keyframes.length === 0) return undefined;
  const t = roundTime(time);
  let prev = keyframes[0];
  if (!prev) return undefined;
  if (t <= prev.time + EPS) return { position: prev.position, rotation: prev.rotation, scale: prev.scale };
  for (let i = 1; i < keyframes.length; i += 1) {
    const next = keyframes[i];
    if (!next) continue;
    if (t <= next.time + EPS) return valueAt(prev, next, t, track.interpolation ?? 'linear');
    prev = next;
  }
  return { position: prev.position, rotation: prev.rotation, scale: prev.scale };
}

export function findTimeTrack(def: TransformationDefinition, target: TransformationTimeTrackTarget): TransformationTimeTrack | undefined {
  return (def.timeTracks ?? []).find((track) => sameTarget(track.target, target));
}

function frameFromOverride(base: TransformationTransformOffset, override: EditOverride): TransformationTimeKeyframe {
  const live = liveOffset(base, override);
  return {
    time: 0,
    position: override.position ? live.position : undefined,
    rotation: override.rotation ? live.rotation : undefined,
    scale: override.scale !== undefined ? live.scale : undefined,
  };
}

export function keyframeForTarget(def: TransformationDefinition, target: TransformationTimeTrackTarget, override: EditOverride): TransformationTimeKeyframe | null {
  switch (target.kind) {
    case 'root':
      return {
        time: 0,
        position: override.position,
        rotation: override.rotation ? radiansToDegrees(override.rotation) : undefined,
        scale: override.scale !== undefined ? scaleNumber(override.scale) ?? def.modelScale ?? 1 : undefined,
      };
    case 'model-slot':
      return frameFromOverride(def.modelSlotOffsets?.[target.slot] ?? DEFAULT_OFFSET, override);
    case 'part': {
      const part = (def.parts ?? []).find((p) => p.key === target.partKey);
      if (!part) return null;
      return frameFromOverride({ position: part.basePosition, rotation: part.baseRotation, scale: part.baseScale }, override);
    }
    case 'stage-model': {
      const stage = def.stages.find((s) => s.id === target.stageId);
      if (!stage) return null;
      return frameFromOverride(stage.params.modelOffset ?? DEFAULT_OFFSET, override);
    }
    case 'stage-move':
    case 'stage-part-move': {
      const stage = def.stages.find((s) => s.id === target.stageId);
      if (!stage) return null;
      return frameFromOverride({ position: stage.params.toPosition ?? [0, 0, 0], rotation: stage.params.toRotation ?? [0, 0, 0], scale: stage.params.toScale ?? 1 }, override);
    }
    case 'effect':
      return override.position ? { time: 0, position: override.position } : null;
    case 'camera-shot':
      return override.position ? { time: 0, position: override.position } : null;
    case 'camera-look':
      return override.position ? { time: 0, position: override.position } : null;
  }
}

export function upsertTimeKeyframe(
  tracks: readonly TransformationTimeTrack[] | undefined,
  target: TransformationTimeTrackTarget,
  time: number,
  keyframe: Omit<TransformationTimeKeyframe, 'time'>,
): TransformationTimeTrack[] {
  const t = roundTime(time);
  const nextTracks = [...(tracks ?? [])];
  const idx = nextTracks.findIndex((track) => sameTarget(track.target, target));
  const incoming: TransformationTimeKeyframe = { ...keyframe, time: t };
  if (idx < 0) {
    return [
      ...nextTracks,
      { id: timeTrackIdForTarget(target), target, interpolation: 'linear', keyframes: [incoming] },
    ];
  }
  const track = nextTracks[idx];
  if (!track) return nextTracks;
  const frames = [...track.keyframes];
  const frameIdx = frames.findIndex((frame) => Math.abs(frame.time - t) <= EPS);
  if (frameIdx >= 0) {
    const old = frames[frameIdx];
    if (old) frames[frameIdx] = { ...old, ...incoming };
  } else {
    frames.push(incoming);
  }
  nextTracks[idx] = { ...track, keyframes: frames.sort((a, b) => a.time - b.time) };
  return nextTracks;
}

export function removeTimeKeyframeAt(
  tracks: readonly TransformationTimeTrack[] | undefined,
  target: TransformationTimeTrackTarget,
  time: number,
): TransformationTimeTrack[] {
  const t = roundTime(time);
  return (tracks ?? [])
    .map((track) => sameTarget(track.target, target) ? { ...track, keyframes: track.keyframes.filter((frame) => Math.abs(frame.time - t) > EPS) } : track)
    .filter((track) => track.keyframes.length > 0);
}

export function removeTimeTrack(
  tracks: readonly TransformationTimeTrack[] | undefined,
  target: TransformationTimeTrackTarget,
): TransformationTimeTrack[] {
  return (tracks ?? []).filter((track) => !sameTarget(track.target, target));
}

function applyTrackToOffset(offset: TransformationTransformOffset, track: EvaluatedTimeTrack | undefined): TransformationTransformOffset {
  if (!track) return offset;
  return {
    position: track.position ?? offset.position,
    rotation: track.rotation ?? offset.rotation,
    scale: track.scale ?? offset.scale,
  };
}

function targetTrack(def: TransformationDefinition, target: TransformationTimeTrackTarget, time: number): EvaluatedTimeTrack | undefined {
  return evaluateTimeTrack(findTimeTrack(def, target), time);
}

function stageCameraAnchor(stage: TransformationDefinition['stages'][number]): TransformationVec3 {
  return cameraShotAnchor(stage.params.distance ?? 7, stage.params.height ?? 2, stage.params.angle ?? 0);
}

function applyStageCameraTrack(stage: TransformationDefinition['stages'][number], anchor: EvaluatedTimeTrack | undefined, look: EvaluatedTimeTrack | undefined): TransformationDefinition['stages'][number] {
  if (stage.type !== 'camera-shot' || (!anchor?.position && !look?.position)) return stage;
  const placed = anchor?.position
    ? cameraShotFromAnchor({
      id: stage.id,
      type: stage.params.cameraShotType ?? 'orbit',
      startTime: stage.startTime,
      duration: stage.duration,
      targetPart: stage.params.partKey,
      distance: stage.params.distance ?? 7,
      height: stage.params.height ?? 2,
      angle: stage.params.angle ?? 0,
      fov: stage.params.fov ?? 55,
    }, anchor.position)
    : undefined;
  return {
    ...stage,
    params: {
      ...stage.params,
      ...(placed && { distance: placed.distance, height: placed.height, angle: placed.angle }),
      ...(look?.position && { lookAtOffset: look.position }),
    },
  };
}

export function applyTransformationTimeTracks(def: TransformationDefinition, time: number): TransformationDefinition {
  if (!def.timeTracks || def.timeTracks.length === 0) return def;
  const rootTrack = targetTrack(def, { kind: 'root' }, time);
  const modelSlotOffsets: Partial<Record<ModelSlot, TransformationTransformOffset>> = { ...(def.modelSlotOffsets ?? {}) };
  for (const slot of MODEL_SLOTS) {
    modelSlotOffsets[slot] = applyTrackToOffset(def.modelSlotOffsets?.[slot] ?? DEFAULT_OFFSET, targetTrack(def, { kind: 'model-slot', slot }, time));
  }
  return {
    ...def,
    rootPosition: rootTrack?.position ?? def.rootPosition,
    rootRotation: rootTrack?.rotation ?? def.rootRotation,
    modelScale: rootTrack?.scale ?? def.modelScale,
    modelSlotOffsets,
    parts: (def.parts ?? []).map((part): TransformationPart => {
      const track = targetTrack(def, { kind: 'part', partKey: part.key }, time);
      return track ? { ...part, basePosition: track.position ?? part.basePosition, baseRotation: track.rotation ?? part.baseRotation, baseScale: track.scale ?? part.baseScale } : part;
    }),
    stages: def.stages.map((stage) => {
      const stageModel = targetTrack(def, { kind: 'stage-model', stageId: stage.id }, time);
      const stageMove = targetTrack(def, { kind: 'stage-move', stageId: stage.id }, time);
      const stagePart = targetTrack(def, { kind: 'stage-part-move', stageId: stage.id }, time);
      const stageCamera = targetTrack(def, { kind: 'camera-shot', shotId: stage.id }, time);
      const stageCameraLook = targetTrack(def, { kind: 'camera-look', shotId: stage.id }, time);
      const move = stageMove ?? stagePart;
      const cameraStage = applyStageCameraTrack(stage, stageCamera, stageCameraLook);
      if (!stageModel && !move) return cameraStage;
      return {
        ...cameraStage,
        params: {
          ...cameraStage.params,
          ...(stageModel && { modelOffset: applyTrackToOffset(cameraStage.params.modelOffset ?? DEFAULT_OFFSET, stageModel) }),
          ...(move && {
            toPosition: move.position ?? cameraStage.params.toPosition,
            toRotation: move.rotation ?? cameraStage.params.toRotation,
            toScale: move.scale ?? cameraStage.params.toScale,
          }),
        },
      };
    }),
    effectTracks: (def.effectTracks ?? []).map((effect): TransformationEffectTrack => {
      const track = targetTrack(def, { kind: 'effect', effectId: effect.id }, time);
      return track?.position ? { ...effect, spawnOffset: track.position } : effect;
    }),
    cameraShots: (def.cameraShots ?? []).map((shot) => {
      const anchor = targetTrack(def, { kind: 'camera-shot', shotId: shot.id }, time);
      const look = targetTrack(def, { kind: 'camera-look', shotId: shot.id }, time);
      const placed = anchor?.position ? cameraShotFromAnchor(shot, anchor.position) : shot;
      return look?.position ? { ...placed, lookAtOffset: look.position } : placed;
    }),
  };
}

export function keyframeTransformForTarget(def: TransformationDefinition, target: TransformationTimeTrackTarget, time: number): TransformationTransformOffset | undefined {
  const track = evaluateTimeTrack(findTimeTrack(def, target), time);
  if (!track) return undefined;
  switch (target.kind) {
    case 'root':
      return { position: track.position ?? def.rootPosition ?? [0, 0, 0], rotation: track.rotation ?? def.rootRotation ?? [0, 0, 0], scale: track.scale ?? def.modelScale ?? 1 };
    case 'model-slot':
      return applyTrackToOffset(def.modelSlotOffsets?.[target.slot] ?? DEFAULT_OFFSET, track);
    case 'part': {
      const part = (def.parts ?? []).find((p) => p.key === target.partKey);
      if (!part) return undefined;
      return { position: track.position ?? part.basePosition, rotation: track.rotation ?? part.baseRotation, scale: track.scale ?? part.baseScale };
    }
    case 'stage-model': {
      const stage = def.stages.find((s) => s.id === target.stageId);
      return stage ? applyTrackToOffset(stage.params.modelOffset ?? DEFAULT_OFFSET, track) : undefined;
    }
    case 'stage-move':
    case 'stage-part-move': {
      const stage = def.stages.find((s) => s.id === target.stageId);
      return stage ? { position: track.position ?? stage.params.toPosition ?? [0, 0, 0], rotation: track.rotation ?? stage.params.toRotation ?? [0, 0, 0], scale: track.scale ?? stage.params.toScale ?? 1 } : undefined;
    }
    case 'effect': {
      const effect = (def.effectTracks ?? []).find((fx) => fx.id === target.effectId);
      return { position: track.position ?? effect?.spawnOffset ?? [0, 0, 0], rotation: [0, 0, 0], scale: 1 };
    }
    case 'camera-shot': {
      const shot = (def.cameraShots ?? []).find((s) => s.id === target.shotId);
      const stage = def.stages.find((s) => s.id === target.shotId && s.type === 'camera-shot');
      return { position: track.position ?? (shot ? cameraShotAnchor(shot.distance, shot.height, shot.angle) : stage ? stageCameraAnchor(stage) : [0, 0, 0]), rotation: [0, 0, 0], scale: 1 };
    }
    case 'camera-look': {
      const shot = (def.cameraShots ?? []).find((s) => s.id === target.shotId);
      const stage = def.stages.find((s) => s.id === target.shotId && s.type === 'camera-shot');
      return { position: track.position ?? shot?.lookAtOffset ?? stage?.params.lookAtOffset ?? [0, 0.4, 0], rotation: [0, 0, 0], scale: 1 };
    }
  }
}

export function overrideFromCurrentObject(override: EditOverride): Omit<TransformationTimeKeyframe, 'time'> {
  return {
    position: override.position,
    rotation: override.rotation ? radiansToDegrees(override.rotation) : undefined,
    scale: override.scale !== undefined ? (Array.isArray(override.scale) ? asScaleVec(override.scale)[0] : override.scale) : undefined,
  };
}

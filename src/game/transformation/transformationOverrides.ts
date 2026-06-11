import { asScaleVec, type EditOverride, type Vec3 } from '../edit/sceneEditMerge';
import { transformModelSlotKey, transformPartKey, transformStageModelKey, transformEffectKey, transformStageMoveKey, transformCameraShotKey, transformStagePartMoveKey, transformCameraLookKey } from './transformPartKey';
import { MODEL_SLOTS, type ModelSlot, type TransformationDefinition, type TransformationStage, type TransformationTransformOffset, type TransformationVec3 } from '../../types/game/transformation';

// Pure transformation edit-merge helpers (no React / no R3F → unit-testable). Shared by TransformationStage
// (live preview merge + drag-end bake) and the ✨ Transform tab (live numbers), so both agree exactly.
const RAD2DEG = 180 / Math.PI;
export const DEFAULT_OFFSET: TransformationTransformOffset = { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 };

export function scaleNumber(scale: EditOverride['scale']): number | undefined {
  if (scale === undefined) return undefined;
  if (typeof scale === 'number') return scale;
  const v = asScaleVec(scale);
  return (v[0] + v[1] + v[2]) / 3;
}

export function radiansToDegrees(rotation: Vec3): TransformationVec3 {
  return [rotation[0] * RAD2DEG, rotation[1] * RAD2DEG, rotation[2] * RAD2DEG];
}

// The live offset = authored base ⊕ a sceneEditStore override (gizmo drag, rotation in radians → degrees).
export function liveOffset(base: TransformationTransformOffset | undefined, override: EditOverride | undefined): TransformationTransformOffset {
  const src = base ?? DEFAULT_OFFSET;
  return {
    position: override?.position ?? src.position,
    rotation: override?.rotation ? radiansToDegrees(override.rotation) : src.rotation,
    scale: scaleNumber(override?.scale) ?? src.scale,
  };
}

// Merge ALL sceneEditStore overrides for a timeline into a fresh def (used for the live preview while editing).
export function mergeTransformationOverrides(def: TransformationDefinition, overrides: Record<string, EditOverride>): TransformationDefinition {
  const modelSlotOffsets: Partial<Record<ModelSlot, TransformationTransformOffset>> = { ...(def.modelSlotOffsets ?? {}) };
  for (const slot of MODEL_SLOTS) {
    modelSlotOffsets[slot] = liveOffset(def.modelSlotOffsets?.[slot], overrides[transformModelSlotKey(def.id, slot)]);
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
      if (!ov) return s;
      return { ...s, params: { ...s.params, modelOffset: liveOffset(s.params.modelOffset, ov) } };
    }),
  };
}

// Bake a SINGLE sceneEditStore override (a finished gizmo drag) into the authored TransformationDefinition,
// returning the patch to apply to the editor store. Recognises the three transform key shapes; returns null
// for an unrelated key so the caller can ignore it.
export function bakeOverrideToDef(def: TransformationDefinition, key: string, override: EditOverride): Partial<TransformationDefinition> | null {
  for (const slot of MODEL_SLOTS) {
    if (key === transformModelSlotKey(def.id, slot)) {
      return { modelSlotOffsets: { ...(def.modelSlotOffsets ?? {}), [slot]: liveOffset(def.modelSlotOffsets?.[slot], override) } };
    }
  }
  for (const p of def.parts ?? []) {
    if (key === transformPartKey(def.id, p.key)) {
      const o = liveOffset({ position: p.basePosition, rotation: p.baseRotation, scale: p.baseScale }, override);
      return { parts: def.parts.map((x) => (x.key === p.key ? { ...x, basePosition: o.position, baseRotation: o.rotation, baseScale: o.scale } : x)) };
    }
  }
  for (const s of def.stages) {
    if (s.type === 'model-swap' && key === transformStageModelKey(def.id, s.id)) {
      return { stages: def.stages.map((x) => (x.id === s.id ? { ...x, params: { ...x.params, modelOffset: liveOffset(x.params.modelOffset, override) } } : x)) };
    }
    if (s.type === 'model-move' && key === transformStageMoveKey(def.id, s.id)) {
      const o = liveOffset({ position: s.params.toPosition ?? [0, 0, 0], rotation: s.params.toRotation ?? [0, 0, 0], scale: s.params.toScale ?? 1 }, override);
      return { stages: def.stages.map((x) => (x.id === s.id ? { ...x, params: { ...x.params, toPosition: o.position, toRotation: o.rotation, toScale: o.scale } } : x)) };
    }
    if (s.type === 'part-transform' && key === transformStagePartMoveKey(def.id, s.id)) {
      const o = liveOffset({ position: s.params.toPosition ?? [0, 0, 0], rotation: s.params.toRotation ?? [0, 0, 0], scale: s.params.toScale ?? 1 }, override);
      return { stages: def.stages.map((x) => (x.id === s.id ? { ...x, params: { ...x.params, toPosition: o.position, toRotation: o.rotation, toScale: o.scale } } : x)) };
    }
  }
  for (const fx of def.effectTracks ?? []) {
    if (key === transformEffectKey(def.id, fx.id) && override.position) {
      return { effectTracks: def.effectTracks.map((x) => (x.id === fx.id ? { ...x, spawnOffset: override.position } : x)) };
    }
  }
  for (const sh of def.cameraShots ?? []) {
    if (key === transformCameraShotKey(def.id, sh.id) && override.position) {
      const [x, , z] = override.position;
      return {
        cameraShots: def.cameraShots.map((c) => (c.id === sh.id
          ? { ...c, distance: Math.round(Math.hypot(x, z) * 100) / 100, angle: Math.round(Math.atan2(x, z) * RAD2DEG * 100) / 100, height: Math.round(override.position![1] * 100) / 100 }
          : c)),
      };
    }
    if (key === transformCameraLookKey(def.id, sh.id) && override.position) {
      return { cameraShots: def.cameraShots.map((c) => (c.id === sh.id ? { ...c, lookAtOffset: override.position } : c)) };
    }
  }
  return null;
}

// World position of a camera shot's orbit anchor (mirror of TransformationCameraController's orbit math).
export function cameraShotAnchor(distance: number, height: number, angleDeg: number): [number, number, number] {
  const a = angleDeg * (Math.PI / 180);
  return [Math.sin(a) * distance, height, Math.cos(a) * distance];
}

// Resolve which model a stage's animation clip targets: explicit modelRef → explicit slot → the nearest
// preceding model-swap/model-visibility stage → the timeline fallback (shared → robot). `modelForSlot`
// resolves a slot to a model-library id (injected so this stays pure / testable).
export function resolveStageClipModelId(
  def: TransformationDefinition,
  stage: TransformationStage,
  modelForSlot: (slot: ModelSlot) => string | undefined,
): string | undefined {
  if (stage.params.modelRef) return stage.params.modelRef;
  if (stage.params.modelSlot) return modelForSlot(stage.params.modelSlot);
  const prior = def.stages
    .filter((s) => (s.type === 'model-swap' || s.type === 'model-visibility') && s.startTime <= stage.startTime)
    .sort((a, b) => a.startTime - b.startTime);
  for (let i = prior.length - 1; i >= 0; i -= 1) {
    const st = prior[i];
    if (!st) continue;
    if (st.params.modelRef) return st.params.modelRef;
    if (st.params.modelSlot) return modelForSlot(st.params.modelSlot);
  }
  return def.sharedModelRef ?? modelForSlot('robot');
}

// The final on-screen scale of a model = the performance root scale (def.modelScale) × the slot's own scale.
export function composeModelScale(def: TransformationDefinition, slotScale: number): { rootScale: number; slotScale: number; effective: number } {
  const rootScale = def.modelScale ?? 1;
  return { rootScale, slotScale, effective: rootScale * slotScale };
}

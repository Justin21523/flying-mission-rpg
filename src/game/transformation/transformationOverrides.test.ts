import { describe, it, expect } from 'vitest';
import { mergeTransformationOverrides, bakeOverrideToDef, resolveStageClipModelId, composeModelScale, liveOffset } from './transformationOverrides';
import { transformModelSlotKey, transformPartKey, transformStageModelKey, transformStageMoveKey, transformEffectKey, transformCameraShotKey, transformStagePartMoveKey, transformCameraLookKey } from './transformPartKey';
import type { EditOverride } from '../edit/sceneEditMerge';
import type { TransformationDefinition } from '../../types/game/transformation';

const HALF_PI = Math.PI / 2;

const def = (over: Partial<TransformationDefinition> = {}): TransformationDefinition => ({
  id: 'xf1',
  name: 'XF',
  formStrategy: 'modular-parts-procedural',
  modeAvailability: { full: true, interactive: true, quick: true },
  totalDurationSec: 4,
  quickDurationSec: 1.6,
  backdropColor: '#000',
  particleColor: '#fff',
  parts: [{ key: 'wing_left', geometry: 'wing', basePosition: [0, 0, 0], baseRotation: [0, 0, 0], baseScale: 1 }],
  stages: [
    { id: 'sw', type: 'model-swap', startTime: 1, duration: 0.2, enabled: true, params: { modelRef: 'm_extra' } },
    { id: 'clip', type: 'animation-clip', startTime: 2, duration: 1, enabled: true, params: {} },
  ],
  cameraShots: [],
  effectTracks: [],
  audioCues: [],
  interactionShowcase: { enabled: false, rotateSpeedDeg: 90, poses: [] },
  controllerSwitchConfig: { planeControllerDisableTime: 0, robotControllerEnableTime: 2 },
  physicsSwitchConfig: { planeColliderDisableTime: 0, robotColliderEnableTime: 2 },
  momentumTransferConfig: { preserveHorizontalVelocity: true, horizontalVelocityMultiplier: 0.4, initialDescentVelocity: 10, clampMaxDescentSpeed: 30, faceCameraOnExit: true },
  ...over,
});

describe('liveOffset', () => {
  it('converts override rotation radians → degrees and keeps base otherwise', () => {
    const o = liveOffset({ position: [1, 1, 1], rotation: [10, 0, 0], scale: 2 }, { rotation: [HALF_PI, 0, 0] });
    expect(o.position).toEqual([1, 1, 1]);
    expect(Math.round(o.rotation[0])).toBe(90);
    expect(o.scale).toBe(2);
  });
});

describe('mergeTransformationOverrides', () => {
  it('merges a robot slot override into modelSlotOffsets (radians → degrees)', () => {
    const overrides: Record<string, EditOverride> = {
      [transformModelSlotKey('xf1', 'robot')]: { position: [2, 0, 0], rotation: [0, HALF_PI, 0], scale: 3 },
    };
    const merged = mergeTransformationOverrides(def(), overrides);
    expect(merged.modelSlotOffsets?.robot?.position).toEqual([2, 0, 0]);
    expect(Math.round(merged.modelSlotOffsets?.robot?.rotation[1] ?? 0)).toBe(90);
    expect(merged.modelSlotOffsets?.robot?.scale).toBe(3);
  });

  it('merges a part override into the part base', () => {
    const overrides: Record<string, EditOverride> = {
      [transformPartKey('xf1', 'wing_left')]: { position: [0, 5, 0] },
    };
    const merged = mergeTransformationOverrides(def(), overrides);
    expect(merged.parts[0].basePosition).toEqual([0, 5, 0]);
  });

  it('merges a model-swap stage override into params.modelOffset', () => {
    const overrides: Record<string, EditOverride> = {
      [transformStageModelKey('xf1', 'sw')]: { position: [0, 0, 4], scale: 0.5 },
    };
    const merged = mergeTransformationOverrides(def(), overrides);
    const sw = merged.stages.find((s) => s.id === 'sw');
    expect(sw?.params.modelOffset?.position).toEqual([0, 0, 4]);
    expect(sw?.params.modelOffset?.scale).toBe(0.5);
  });
});

describe('bakeOverrideToDef', () => {
  it('bakes a slot override into modelSlotOffsets', () => {
    const patch = bakeOverrideToDef(def(), transformModelSlotKey('xf1', 'plane'), { position: [1, 2, 3] });
    expect(patch?.modelSlotOffsets?.plane?.position).toEqual([1, 2, 3]);
  });
  it('bakes a part override into parts base', () => {
    const patch = bakeOverrideToDef(def(), transformPartKey('xf1', 'wing_left'), { scale: 2 });
    expect(patch?.parts?.[0].baseScale).toBe(2);
  });
  it('bakes a stage-model override into params.modelOffset', () => {
    const patch = bakeOverrideToDef(def(), transformStageModelKey('xf1', 'sw'), { position: [0, 9, 0] });
    expect(patch?.stages?.find((s) => s.id === 'sw')?.params.modelOffset?.position).toEqual([0, 9, 0]);
  });
  it('bakes a model-move stage override into toPosition', () => {
    const d = def({ stages: [{ id: 'mv', type: 'model-move', startTime: 0, duration: 1, enabled: true, params: { modelSlot: 'robot' } }] });
    const patch = bakeOverrideToDef(d, transformStageMoveKey('xf1', 'mv'), { position: [0, 3, 0] });
    expect(patch?.stages?.find((s) => s.id === 'mv')?.params.toPosition).toEqual([0, 3, 0]);
  });
  it('bakes a part-transform destination override into toPosition', () => {
    const d = def({ stages: [{ id: 'pt', type: 'part-transform', startTime: 0, duration: 1, enabled: true, params: { partKey: 'wing_left' } }] });
    const patch = bakeOverrideToDef(d, transformStagePartMoveKey('xf1', 'pt'), { position: [2, 0, 0] });
    expect(patch?.stages?.find((s) => s.id === 'pt')?.params.toPosition).toEqual([2, 0, 0]);
  });
  it('bakes a camera look-at override into lookAtOffset', () => {
    const d = def({ cameraShots: [{ id: 'cs1', type: 'orbit', startTime: 0, duration: 1, distance: 5, height: 2, angle: 0, fov: 50 }] });
    const patch = bakeOverrideToDef(d, transformCameraLookKey('xf1', 'cs1'), { position: [0, 1.5, 0] });
    expect(patch?.cameraShots?.[0].lookAtOffset).toEqual([0, 1.5, 0]);
  });
  it('bakes an effect override into spawnOffset', () => {
    const d = def({ effectTracks: [{ id: 'fx1', type: 'energy-ring', startTime: 0, duration: 1 }] });
    const patch = bakeOverrideToDef(d, transformEffectKey('xf1', 'fx1'), { position: [1, 1, 1] });
    expect(patch?.effectTracks?.[0].spawnOffset).toEqual([1, 1, 1]);
  });
  it('bakes a camera-shot override into distance/angle/height', () => {
    const d = def({ cameraShots: [{ id: 'cs1', type: 'orbit', startTime: 0, duration: 1, distance: 5, height: 2, angle: 0, fov: 50 }] });
    const patch = bakeOverrideToDef(d, transformCameraShotKey('xf1', 'cs1'), { position: [0, 4, 8] });
    const cs = patch?.cameraShots?.[0];
    expect(cs?.distance).toBeCloseTo(8, 1);
    expect(cs?.height).toBeCloseTo(4, 1);
    expect(cs?.angle).toBeCloseTo(0, 1); // (0,_,8) → atan2(0,8)=0
  });
  it('returns null for an unrelated key', () => {
    expect(bakeOverrideToDef(def(), 'base#structure#whatever', { position: [0, 0, 0] })).toBeNull();
  });
});

describe('resolveStageClipModelId', () => {
  const modelForSlot = (slot: string) => (slot === 'robot' ? 'm_robot' : slot === 'plane' ? 'm_plane' : 'm_shared');

  it('explicit modelRef wins', () => {
    const d = def();
    const stage = { ...d.stages[1], params: { modelRef: 'm_x' } };
    expect(resolveStageClipModelId(d, stage, modelForSlot)).toBe('m_x');
  });
  it('explicit slot resolves via modelForSlot', () => {
    const d = def();
    const stage = { ...d.stages[1], params: { modelSlot: 'plane' as const } };
    expect(resolveStageClipModelId(d, stage, modelForSlot)).toBe('m_plane');
  });
  it('falls back to the nearest preceding model-swap modelRef', () => {
    const d = def();
    // clip stage at t=2 has a prior model-swap at t=1 with modelRef m_extra
    expect(resolveStageClipModelId(d, d.stages[1], modelForSlot)).toBe('m_extra');
  });
  it('falls back to shared → robot when nothing precedes', () => {
    const d = def({ stages: [{ id: 'clip', type: 'animation-clip', startTime: 0, duration: 1, enabled: true, params: {} }] });
    expect(resolveStageClipModelId(d, d.stages[0], modelForSlot)).toBe('m_robot');
    const d2 = def({ sharedModelRef: 'm_shared_ref', stages: [{ id: 'clip', type: 'animation-clip', startTime: 0, duration: 1, enabled: true, params: {} }] });
    expect(resolveStageClipModelId(d2, d2.stages[0], modelForSlot)).toBe('m_shared_ref');
  });
});

describe('composeModelScale', () => {
  it('multiplies the performance root scale by the slot scale', () => {
    const c = composeModelScale(def({ modelScale: 2 }), 3);
    expect(c.rootScale).toBe(2);
    expect(c.slotScale).toBe(3);
    expect(c.effective).toBe(6);
  });
  it('defaults modelScale to 1', () => {
    expect(composeModelScale(def(), 1.5).effective).toBe(1.5);
  });
});

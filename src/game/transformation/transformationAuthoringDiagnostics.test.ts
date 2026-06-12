import { beforeEach, describe, expect, it } from 'vitest';
import { Object3D } from 'three';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import { makeTimeline } from './testFixture';
import { modelSlotVisibilityDiagnostics, stageClipDiagnostic, stageScrubTimes, stageTargetDiagnostic } from './transformationAuthoringDiagnostics';
import { transformModelSlotKey, transformRootKey } from './transformPartKey';
import type { TransformationStage } from '../../types/game/transformation';

describe('transformationAuthoringDiagnostics', () => {
  it('computes start, middle, and end scrub points', () => {
    expect(stageScrubTimes({ id: 's', type: 'finish-pose', startTime: 2, duration: 4, enabled: true, params: {} })).toEqual({ start: 2, middle: 4, end: 6 });
  });

  it('describes stage targets for authoring breadcrumbs', () => {
    const stage: TransformationStage = { id: 'clip', type: 'animation-clip', startTime: 0, duration: 1, enabled: true, params: { modelSlot: 'shared' } };

    expect(stageTargetDiagnostic(stage).label).toBe('shared slot');
  });

  it('reports missing clips and a first-valid fallback', () => {
    const stage: TransformationStage = { id: 'clip', type: 'animation-clip', startTime: 0, duration: 1, enabled: true, params: { clipName: 'Missing' } };
    const result = stageClipDiagnostic(stage, 'model_a', ['Idle', 'Wave']);

    expect(result.ok).toBe(false);
    expect(result.missing).toBe(true);
    expect(result.firstValidClip).toBe('Idle');
  });

  it('summarizes final slot visibility from visibility stages', () => {
    const def = makeTimeline({
      robotModelRef: 'robot_model',
      planeModelRef: 'plane_model',
      stages: [
        { id: 'hide_plane', type: 'model-visibility', startTime: 0, duration: 0.1, enabled: true, params: { modelSlot: 'plane', visible: false } },
        { id: 'show_robot', type: 'model-visibility', startTime: 1, duration: 0.1, enabled: true, params: { modelSlot: 'robot', visible: true } },
      ],
    });

    const rows = modelSlotVisibilityDiagnostics(def, (slot) => (slot === 'robot' ? def.robotModelRef : def.planeModelRef));

    expect(rows.find((row) => row.slot === 'plane')?.visible).toBe(false);
    expect(rows.find((row) => row.slot === 'robot')?.sourceStageId).toBe('show_robot');
  });
});

describe('sceneEditStore selection lock', () => {
  beforeEach(() => {
    useSceneEditStore.setState({ selectedKey: null, selectedObject: null, selectedAssetId: null, selectionLockKey: null, pendingSelectKey: null, extraSelected: [] });
  });

  it('keeps selection on the locked transformation target', () => {
    const root = transformRootKey('xf_test');
    const robot = transformModelSlotKey('xf_test', 'robot');
    const rootObject = new Object3D();
    const robotObject = new Object3D();

    useSceneEditStore.getState().select(root, rootObject);
    useSceneEditStore.getState().setSelectionLock(root);
    useSceneEditStore.getState().select(robot, robotObject);
    useSceneEditStore.getState().requestSelect(robot);

    expect(useSceneEditStore.getState().selectedKey).toBe(root);
    expect(useSceneEditStore.getState().pendingSelectKey).toBeNull();

    useSceneEditStore.getState().setSelectionLock(null);
    useSceneEditStore.getState().select(robot, robotObject);
    expect(useSceneEditStore.getState().selectedKey).toBe(robot);
  });
});

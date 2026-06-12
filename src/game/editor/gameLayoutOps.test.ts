import { beforeEach, describe, expect, it } from 'vitest';
import { Object3D } from 'three';
import { useEditorTransformationStore } from '../../stores/game/editorTransformationStore';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import type { TransformationDefinition } from '../../types/game/transformation';
import { deleteGameSelection } from './gameLayoutOps';
import { transformCameraShotKey, transformEffectKey, transformPartKey, transformStageMoveKey } from '../transformation/transformPartKey';

const def = (): TransformationDefinition => ({
  id: 'xf_test',
  name: 'Test Transform',
  formStrategy: 'modular-parts-procedural',
  modeAvailability: { full: true, interactive: true, quick: true },
  totalDurationSec: 4,
  quickDurationSec: 2,
  backdropColor: '#000000',
  particleColor: '#ffffff',
  parts: [{ key: 'wing_left', geometry: 'wing', basePosition: [0, 0, 0], baseRotation: [0, 0, 0], baseScale: 1 }],
  stages: [{ id: 's_move', type: 'model-move', startTime: 0, duration: 1, enabled: true, params: {} }],
  cameraShots: [{ id: 'c_1', type: 'orbit', startTime: 0, duration: 1, distance: 6, height: 2, angle: 0, fov: 50 }],
  effectTracks: [{ id: 'e_1', type: 'glow-pulse', startTime: 0, duration: 1 }],
  audioCues: [],
  interactionShowcase: { enabled: true, rotateSpeedDeg: 90, poses: [] },
  controllerSwitchConfig: { planeControllerDisableTime: 0, robotControllerEnableTime: 1 },
  physicsSwitchConfig: { planeColliderDisableTime: 0, robotColliderEnableTime: 1 },
  momentumTransferConfig: { preserveHorizontalVelocity: true, horizontalVelocityMultiplier: 1, initialDescentVelocity: 0, clampMaxDescentSpeed: 10, faceCameraOnExit: true },
});

function select(key: string): void {
  useSceneEditStore.setState({ selectedKey: key, extraSelected: [], selectedObject: null, selectedAssetId: null });
}

describe('deleteGameSelection transformation gizmos', () => {
  beforeEach(() => {
    useEditorTransformationStore.setState({ items: [def()], seeded: true });
    useSceneEditStore.setState({ selectedKey: null, extraSelected: [], overrides: {}, deleted: {} });
  });

  it('removes selected transformation parts from the definition', () => {
    select(transformPartKey('xf_test', 'wing_left'));
    expect(deleteGameSelection()).toBe(true);
    expect(useEditorTransformationStore.getState().items[0].parts).toEqual([]);
  });

  it('removes selected stage anchors from the timeline', () => {
    select(transformStageMoveKey('xf_test', 's_move'));
    expect(deleteGameSelection()).toBe(true);
    expect(useEditorTransformationStore.getState().items[0].stages).toEqual([]);
  });

  it('removes selected camera and effect anchors', () => {
    useSceneEditStore.setState({
      selectedKey: transformCameraShotKey('xf_test', 'c_1'),
      extraSelected: [{ key: transformEffectKey('xf_test', 'e_1'), object: new Object3D(), assetId: null }],
    });
    expect(deleteGameSelection()).toBe(true);
    const item = useEditorTransformationStore.getState().items[0];
    expect(item.cameraShots).toEqual([]);
    expect(item.effectTracks).toEqual([]);
  });
});

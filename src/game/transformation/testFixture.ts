import type { TransformationDefinition } from '../../types/game/transformation';

// Shared minimal VALID timeline fixture for the transformation unit tests.
export function makeTimeline(over: Partial<TransformationDefinition> = {}): TransformationDefinition {
  return {
    id: 'xf_test',
    characterId: 'char_jett',
    name: 'Test',
    formStrategy: 'modular-parts-procedural',
    modeAvailability: { full: true, interactive: true, quick: true },
    totalDurationSec: 4,
    quickDurationSec: 1.5,
    robotModelRef: 'm_robot',
    backdropColor: '#101820',
    particleColor: '#e8442c',
    parts: [
      { key: 'wing_left', geometry: 'wing', basePosition: [0, 0, 0], baseRotation: [0, 0, 0], baseScale: 1 },
    ],
    stages: [
      { id: 's1', type: 'part-transform', startTime: 0.5, duration: 0.5, enabled: true, params: { partKey: 'wing_left', toRotation: [0, 0, 90] } },
      { id: 's2', type: 'model-visibility', startTime: 2.6, duration: 0.1, enabled: true, essential: true, params: { modelSlot: 'robot', visible: true } },
      { id: 's3', type: 'finish-pose', startTime: 3, duration: 0.5, enabled: true, essential: true, params: {} },
      { id: 's4', type: 'exit-stage', startTime: 3.8, duration: 0.2, enabled: true, essential: true, params: { targetPhase: 'DESCENT' } },
    ],
    cameraShots: [{ id: 'c1', type: 'orbit', startTime: 0, duration: 2, distance: 6, height: 2, angle: 0, fov: 50 }],
    effectTracks: [{ id: 'e1', type: 'white-flash', startTime: 2.5, duration: 0.3 }],
    audioCues: [],
    interactionShowcase: { enabled: true, rotateSpeedDeg: 90, poses: ['Hero', 'Wave', 'Dance'] },
    controllerSwitchConfig: { planeControllerDisableTime: 0, robotControllerEnableTime: 2.7 },
    physicsSwitchConfig: { planeColliderDisableTime: 2.6, robotColliderEnableTime: 2.7 },
    momentumTransferConfig: { preserveHorizontalVelocity: true, horizontalVelocityMultiplier: 0.5, initialDescentVelocity: 8, clampMaxDescentSpeed: 30, faceCameraOnExit: true },
    ...over,
  };
}

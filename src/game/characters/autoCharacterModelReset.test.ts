import { describe, expect, it } from 'vitest';
import { resetPlaneModelToAuto, resetRobotModelToAuto } from './autoCharacterModelReset';

describe('autoCharacterModelReset', () => {
  it('restores the auto primary robot model', () => {
    expect(resetRobotModelToAuto('char_paul')).toEqual({ modelAssetId: 'aero-mission/Paul+transformer+3d+model' });
  });

  it('restores the auto primary plane model when one exists', () => {
    expect(resetPlaneModelToAuto('char_paul')).toEqual({ planeModelAssetId: 'aero-mission/Paul airplane 3d model' });
  });

  it('restores an auto-derived plane model when one is discovered', () => {
    expect(resetPlaneModelToAuto('char_jett')).toEqual({ planeModelAssetId: 'aero-mission/Jett+airplane+3d+model' });
  });
});

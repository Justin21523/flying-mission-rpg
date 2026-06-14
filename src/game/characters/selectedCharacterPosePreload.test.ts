import { describe, expect, it } from 'vitest';
import type { ModelAsset } from '../../data/modelLibrary';
import type { CharacterPoseModel } from '../../types/game/character';
import { poseModelPreloadPaths } from './selectedCharacterPosePreload';

const baseAsset = (id: string, path: string): ModelAsset => ({
  id,
  label: id,
  path,
  scale: 1,
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  clips: {},
  category: 'aero-mission',
});

const pose = (assetId: string): CharacterPoseModel => ({ id: assetId.replace(/\W+/g, '_'), label: assetId, assetId });

describe('poseModelPreloadPaths', () => {
  it('returns encoded unique paths for resolved pose model assets only', () => {
    const paths = poseModelPreloadPaths(
      [pose('a'), pose('missing'), pose('b'), pose('a')],
      (assetId) => {
        if (assetId === 'a') return baseAsset('a', '/models/aero-mission/Jett pose 3d model.glb');
        if (assetId === 'b') return baseAsset('b', '/models/aero-mission/Jett+transformer+3d+model.glb');
        return undefined;
      },
    );

    expect(paths).toEqual([
      '/models/aero-mission/Jett%20pose%203d%20model.glb',
      '/models/aero-mission/Jett+transformer+3d+model.glb',
    ]);
  });
});

import { describe, it, expect } from 'vitest';
import {
  SUPER_WINGS_MODELS,
  buildHeroModelIntakeRows,
  deriveHeroModelCatalog,
  heroPoseAssetIds,
  id,
  poseModelsFor,
  primaryPlaneModelAssetIdFor,
  primaryRobotModelAssetIdFor,
  type HeroAssetInput,
} from './heroModels';

const HEROES = ['char_jett', 'char_jerome', 'char_donnie', 'char_paul', 'char_bello', 'char_chase', 'char_flip', 'char_todd'];

function asset(idValue: string): HeroAssetInput {
  return { id: idValue, label: idValue.split('/').pop() ?? idValue };
}

describe('aero-mission model catalog', () => {
  it('auto-derives all seeded heroes from the model library', () => {
    expect(Object.keys(SUPER_WINGS_MODELS)).toEqual(expect.arrayContaining(HEROES));

    for (const hero of HEROES) {
      const list = poseModelsFor(hero);
      expect(list.length).toBeGreaterThan(0);
      const ids = list.map((pose) => pose.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const pose of list) {
        expect(pose.assetId.startsWith('super-wings/')).toBe(true);
        expect(pose.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('pins robot and plane primaries while keeping pose lists auto-derived', () => {
    expect(primaryRobotModelAssetIdFor('char_paul')).toBe(id('Paul+transformer+3d+model'));
    expect(primaryPlaneModelAssetIdFor('char_paul')).toBe(id('Paul airplane 3d model'));
    expect(poseModelsFor('char_paul')[0]?.assetId).toBe(id('Paul+transformer+3d+model'));
  });

  it('heroPoseAssetIds returns auto-derived pose ids only', () => {
    expect(heroPoseAssetIds('char_flip').every((assetId) => assetId.startsWith('super-wings/'))).toBe(true);
    expect(heroPoseAssetIds('char_flip')).toContain(id('Flip pose 3d model'));
    expect(heroPoseAssetIds('char_flip')).not.toContain(id('Flip+landing+1+robot'));
    expect(heroPoseAssetIds('char_jett')).toContain(id('Jett+pose+3d+model'));
  });

  it('groups an injected new filename by character name prefix', () => {
    const catalog = deriveHeroModelCatalog(
      [
        asset(id('Jett+transformer+3d+model')),
        asset(id('Jett new rescue pose 3d model')),
        asset('super-wings/futuristic aircraft hangar 3d model'),
      ],
      {},
      ['jett'],
    );

    expect(catalog.char_jett?.allAssetIds).toEqual([
      id('Jett+transformer+3d+model'),
      id('Jett new rescue pose 3d model'),
    ]);
  });

  it('matches character name prefixes case-insensitively', () => {
    const catalog = deriveHeroModelCatalog(
      [asset(id('paul+transformer+3d+model')), asset(id('Paul pose 3d model'))],
      {},
      ['paul'],
    );

    expect(catalog.char_paul?.robotAssetId).toBe(id('paul+transformer+3d+model'));
    expect(catalog.char_paul?.poseAssetIds).toEqual([id('Paul pose 3d model')]);
  });

  it('can derive a future character when its name is requested', () => {
    const catalog = deriveHeroModelCatalog(
      [asset(id('Nova+transformer+3d+model')), asset(id('Nova pose 3d model'))],
      {},
      ['nova'],
    );

    expect(catalog.char_nova?.allAssetIds).toEqual([id('Nova+transformer+3d+model'), id('Nova pose 3d model')]);
  });

  it('supports manual pin and hide overrides without a hand-written pose catalog', () => {
    const hidden = id('Jett hidden pose 3d model');
    const pinnedPlane = id('Jett alternate airplane 3d model');
    const catalog = deriveHeroModelCatalog(
      [
        asset(id('Jett+transformer+3d+model')),
        asset(id('Jett pose 3d model')),
        asset(hidden),
        asset(pinnedPlane),
      ],
      {
        char_jett: {
          planeAssetId: pinnedPlane,
          hiddenAssetIds: [hidden],
        },
      },
      ['jett'],
    );

    expect(catalog.char_jett?.planeAssetId).toBe(pinnedPlane);
    expect(catalog.char_jett?.allAssetIds).not.toContain(hidden);
    expect(catalog.char_jett?.poseAssetIds).toEqual([id('Jett pose 3d model')]);
  });

  it('builds intake QA rows for assigned, hidden, and unassigned assets', () => {
    const hidden = id('Jett hidden pose 3d model');
    const rows = buildHeroModelIntakeRows(
      [
        asset(id('Jett+transformer+3d+model')),
        asset(id('Jett pose 3d model')),
        asset(hidden),
        asset('super-wings/futuristic aircraft hangar 3d model'),
      ],
      {
        char_jett: {
          robotAssetId: id('Jett+transformer+3d+model'),
          hiddenAssetIds: [hidden],
        },
      },
      ['jett'],
    );

    expect(rows.find((row) => row.assetId === id('Jett+transformer+3d+model'))).toMatchObject({
      status: 'assigned',
      characterId: 'char_jett',
      kind: 'robot',
      isPrimaryRobot: true,
      isHidden: false,
      isInPoseModels: true,
    });
    expect(rows.find((row) => row.assetId === hidden)).toMatchObject({
      status: 'hidden',
      characterId: 'char_jett',
      isHidden: true,
      isInPoseModels: false,
    });
    expect(rows.find((row) => row.assetId === 'super-wings/futuristic aircraft hangar 3d model')).toMatchObject({
      status: 'unassigned',
      characterId: undefined,
      isInPoseModels: false,
    });
  });
});

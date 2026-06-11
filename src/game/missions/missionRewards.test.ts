import { describe, it, expect } from 'vitest';
import { missionRewardEffects, missionRewardCoins } from './missionRewards';
import type { MissionReward } from '../../types/game/mission';

const r = (p: Partial<MissionReward> & Pick<MissionReward, 'id' | 'type'>): MissionReward => p as MissionReward;

describe('missionRewardEffects', () => {
  it('compiles each reward type to the matching effect (coins excluded)', () => {
    const rewards: MissionReward[] = [
      r({ id: '1', type: 'item', targetId: 'parcel', amount: 2 }),
      r({ id: '2', type: 'worldFlag', targetId: 'harbor_helped' }),
      r({ id: '3', type: 'trust', characterId: 'char_jett', amount: 3 }),
      r({ id: '4', type: 'unlockTool', targetId: 'scanner' }),
      r({ id: '5', type: 'coins', amount: 50 }),
    ];
    expect(missionRewardEffects(rewards)).toEqual([
      { type: 'giveItem', itemId: 'parcel', quantity: 2 },
      { type: 'setWorldFlag', flag: 'harbor_helped' },
      { type: 'increaseTrust', characterId: 'char_jett', amount: 3 },
      { type: 'unlockTool', toolId: 'scanner' },
    ]);
  });
  it('skips rows missing their target', () => {
    expect(missionRewardEffects([r({ id: '1', type: 'item' })])).toEqual([]);
    expect(missionRewardEffects(undefined)).toEqual([]);
  });
});

describe('missionRewardCoins', () => {
  it('sums coin rewards only', () => {
    expect(missionRewardCoins([r({ id: '1', type: 'coins', amount: 10 }), r({ id: '2', type: 'coins', amount: 5 }), r({ id: '3', type: 'item', targetId: 'x' })])).toBe(15);
    expect(missionRewardCoins(undefined)).toBe(0);
  });
});

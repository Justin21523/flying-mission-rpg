import { describe, expect, it } from 'vitest';
import type { CharacterPresence, MultiCharacterLimitConfig } from '../../../types/game/support';
import { rebalanceTiers } from './CharacterTierManager';

const limits: MultiCharacterLimitConfig = {
  maxActiveCharacters: 2,
  maxStandbyCharacters: 1,
  aiTickRateActive: 12,
  aiTickRateStandby: 3,
  remoteUpdateIntervalSeconds: 5,
  autoDemoteWhenOverLimit: true,
};

function presence(characterId: string, aiState: CharacterPresence['aiState'] = 'follow-player'): CharacterPresence {
  return {
    characterId,
    tier: 'active',
    aiState,
    position: [0, 0.8, 0],
    heading: 0,
    controllerActive: false,
    colliderActive: true,
  };
}

describe('CharacterTierManager', () => {
  it('keeps the controlled character active', () => {
    const result = rebalanceTiers([presence('a'), presence('b'), presence('c')], limits, 'c');
    expect(result[0]?.characterId).toBe('c');
    expect(result[0]?.tier).toBe('active');
    expect(result[0]?.controllerActive).toBe(true);
  });

  it('demotes overflow characters to standby and remote', () => {
    const result = rebalanceTiers([presence('a'), presence('b'), presence('c'), presence('d')], limits, 'a');
    expect(result.filter((p) => p.tier === 'active')).toHaveLength(2);
    expect(result.filter((p) => p.tier === 'standby')).toHaveLength(1);
    expect(result.filter((p) => p.tier === 'remote')).toHaveLength(1);
  });

  it('prioritizes objective assist characters before ordinary companions', () => {
    const result = rebalanceTiers([presence('a'), presence('b'), presence('c', 'assist-objective')], { ...limits, maxActiveCharacters: 2 }, 'a');
    expect(result.find((p) => p.characterId === 'c')?.tier).toBe('active');
  });
});

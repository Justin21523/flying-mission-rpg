import type { RoomId } from '../../stores/game/useArenaRunStore';

// Wave 3 — roguelite room config (editable in the ⬆ Progression tab). The room pool is sampled between rounds;
// list a room more than once to weight it. Shop sells a run-buff for coins; gamble risks coins; rest heals;
// elite makes the next wave harder for bonus coins; boon is the classic 3-buff pick.
export interface RoomConfigDefinition {
  id: string; // 'room_config'
  roomPool: RoomId[];
  shopCost: number;
  shopOfferCount: number;
  restHealFraction: number; // 0..1 of max HP/shield/energy restored
  gambleStake: number;
  gambleWinChance: number; // 0..1
  gambleWinMultiplier: number; // payout = stake * multiplier on a win
  eliteRewardCoins: number;
}

export const SEED_ROOM_CONFIG: RoomConfigDefinition[] = [
  {
    id: 'room_config',
    roomPool: ['boon', 'boon', 'shop', 'rest', 'gamble', 'elite'],
    shopCost: 120,
    shopOfferCount: 2,
    restHealFraction: 1,
    gambleStake: 80,
    gambleWinChance: 0.5,
    gambleWinMultiplier: 2,
    eliteRewardCoins: 150,
  },
];

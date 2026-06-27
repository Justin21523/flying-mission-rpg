import { describe, it, expect, beforeEach } from 'vitest';
import { roomGamble, roomRest, roomElite, roomShopBuy, completeRoom } from './RunDirector';
import { useArenaRunStore } from '../../stores/game/useArenaRunStore';
import { useWalletStore } from '../../stores/walletStore';
import { useRoomConfigStore } from '../../stores/game/useRoomConfigStore';
import { useRunBuffDefStore } from '../../stores/game/useRunBuffDefStore';
import { useRunBuffStore } from '../../stores/game/useRunBuffStore';
import { SEED_ROOM_CONFIG } from '../../data/progression/roomConfig';
import { SEED_RUN_BUFFS } from '../../data/progression/runBuffs';

beforeEach(() => {
  useRoomConfigStore.getState().importState({ items: SEED_ROOM_CONFIG });
  useRunBuffDefStore.getState().importState({ items: SEED_RUN_BUFFS });
  useWalletStore.getState().reset();
  useRunBuffStore.getState().resetRun();
  useArenaRunStore.getState().reset();
  useArenaRunStore.getState().start('roguelite', 3, 0);
});

describe('Wave 3 roguelite rooms', () => {
  it('gamble wins pay out the multiplier, losses keep the stake spent', () => {
    useWalletStore.getState().addCoins(200);
    expect(roomGamble(() => 0.1)).toBe(true); // win: -80 +160
    expect(useWalletStore.getState().coins).toBe(280);
    expect(roomGamble(() => 0.9)).toBe(false); // lose: -80
    expect(useWalletStore.getState().coins).toBe(200);
  });

  it('gamble is refused without enough coins', () => {
    useWalletStore.getState().addCoins(10);
    expect(roomGamble(() => 0.1)).toBe(false);
    expect(useWalletStore.getState().coins).toBe(10);
  });

  it('shop buys a run-buff for coins and records it', () => {
    useWalletStore.getState().addCoins(500);
    const buffId = SEED_RUN_BUFFS[0].id;
    expect(roomShopBuy(buffId)).toBe(true);
    expect(useWalletStore.getState().coins).toBe(500 - SEED_ROOM_CONFIG[0].shopCost);
    expect(useRunBuffStore.getState().selectedBuffIds).toContain(buffId);
  });

  it('shop refuses when broke', () => {
    expect(roomShopBuy(SEED_RUN_BUFFS[0].id)).toBe(false);
  });

  it('elite grants bonus coins and flags the next wave', () => {
    roomElite();
    expect(useWalletStore.getState().coins).toBe(SEED_ROOM_CONFIG[0].eliteRewardCoins);
    expect(useArenaRunStore.getState().eliteNextRound).toBe(true);
  });

  it('rest sets a result message', () => {
    roomRest();
    expect(useArenaRunStore.getState().roomResult).toBeTruthy();
  });

  it('completeRoom clears the room and advances the round', () => {
    useArenaRunStore.getState().setRound(2);
    useArenaRunStore.getState().setPendingRoom('rest');
    completeRoom();
    expect(useArenaRunStore.getState().pendingRoomId).toBeUndefined();
    expect(useArenaRunStore.getState().round).toBe(3);
  });
});

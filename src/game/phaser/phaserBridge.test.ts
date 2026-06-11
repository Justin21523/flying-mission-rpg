import { describe, it, expect, beforeEach } from 'vitest';
import { phaserBridge, usePhaserOverlayStore } from './phaserBridge';
import type { PhaserMissionEvent } from './phaserBridge';

describe('phaserBridge', () => {
  beforeEach(() => phaserBridge.dispose());

  it('delivers success results to subscribers while open', () => {
    const got: PhaserMissionEvent[] = [];
    phaserBridge.subscribe((e) => got.push(e));
    phaserBridge.openMiniGame('repair_wiring');
    phaserBridge.emitResult({ type: 'mini-game-success', miniGameId: 'repair_wiring', score: 100 });
    expect(got.map((e) => e.type)).toEqual(['mini-game-started', 'mini-game-success']);
    expect(usePhaserOverlayStore.getState().openId).toBeNull(); // success closes the overlay
  });

  it('unsubscribe stops events', () => {
    const got: PhaserMissionEvent[] = [];
    const unsub = phaserBridge.subscribe((e) => got.push(e));
    unsub();
    phaserBridge.openMiniGame('repair_wiring');
    phaserBridge.emitResult({ type: 'mini-game-success', miniGameId: 'repair_wiring' });
    expect(got).toEqual([]);
  });

  it('late results after close are ignored (no state pollution)', () => {
    const got: PhaserMissionEvent[] = [];
    phaserBridge.subscribe((e) => got.push(e));
    phaserBridge.openMiniGame('repair_wiring');
    phaserBridge.closeMiniGame();
    phaserBridge.emitResult({ type: 'mini-game-success', miniGameId: 'repair_wiring' });
    expect(got.map((e) => e.type)).toEqual(['mini-game-started']); // success dropped
  });

  it('re-subscribing the same listener never duplicates', () => {
    const got: PhaserMissionEvent[] = [];
    const fn = (e: PhaserMissionEvent) => got.push(e);
    phaserBridge.subscribe(fn);
    phaserBridge.subscribe(fn);
    phaserBridge.openMiniGame('repair_wiring');
    expect(got.length).toBe(1);
  });

  it('results for a different mini-game id are ignored', () => {
    const got: PhaserMissionEvent[] = [];
    phaserBridge.subscribe((e) => got.push(e));
    phaserBridge.openMiniGame('repair_wiring');
    phaserBridge.emitResult({ type: 'mini-game-success', miniGameId: 'other_game' });
    expect(got.map((e) => e.type)).toEqual(['mini-game-started']);
  });
});

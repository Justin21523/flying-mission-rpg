import { create } from 'zustand';

// The ONLY channel between Phaser and React/zustand. Phaser scenes receive a result-callback bound to
// `emitResult` (they never import React or any store); React opens/closes the overlay via the small
// zustand state below; gameplay listeners subscribe for results. Guards: a Set prevents duplicate
// subscriptions, and results for a mini-game that is no longer open are IGNORED (no late-result pollution).
export type PhaserMissionEvent =
  | { type: 'mini-game-started'; miniGameId: string }
  | { type: 'mini-game-success'; miniGameId: string; score?: number }
  | { type: 'mini-game-failed'; miniGameId: string; reason?: string }
  | { type: 'mini-game-cancelled'; miniGameId: string };

export type PhaserBridgeListener = (evt: PhaserMissionEvent) => void;

interface PhaserOverlayState {
  openId: string | null;
  payload?: Record<string, string>;
}
export const usePhaserOverlayStore = create<PhaserOverlayState>(() => ({ openId: null, payload: undefined }));

const listeners = new Set<PhaserBridgeListener>();

export const phaserBridge = {
  openMiniGame(miniGameId: string, payload?: Record<string, string>): void {
    usePhaserOverlayStore.setState({ openId: miniGameId, payload });
    for (const l of [...listeners]) l({ type: 'mini-game-started', miniGameId });
  },

  closeMiniGame(): void {
    usePhaserOverlayStore.setState({ openId: null, payload: undefined });
  },

  // Phaser scenes call this (via an injected callback). Late results after close are dropped.
  emitResult(evt: Exclude<PhaserMissionEvent, { type: 'mini-game-started' }>): void {
    const { openId } = usePhaserOverlayStore.getState();
    if (openId === null || openId !== evt.miniGameId) return; // closed / stale → ignore
    if (evt.type !== 'mini-game-failed') usePhaserOverlayStore.setState({ openId: null, payload: undefined });
    for (const l of [...listeners]) l(evt);
  },

  subscribe(fn: PhaserBridgeListener): () => void {
    listeners.add(fn); // Set → re-subscribing the same fn never duplicates
    return () => listeners.delete(fn);
  },

  isOpen(): boolean {
    return usePhaserOverlayStore.getState().openId !== null;
  },

  dispose(): void {
    listeners.clear();
    usePhaserOverlayStore.setState({ openId: null, payload: undefined });
  },
};

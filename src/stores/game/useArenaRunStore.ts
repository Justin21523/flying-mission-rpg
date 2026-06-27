import { create } from 'zustand';

// Batch N — non-persistent runtime state for an Endless / Roguelite arena run (reset each run, NOT saved).
// The RunDirector mutates this through actions; UI reads it. Mirrors the useAdvancedMissionZoneStore pattern
// (bespoke runtime store, no importState / not in saveStore).
export type RunMode = 'endless' | 'roguelite';
// Wave 3 — 'room' is a roguelite interstitial (shop / gamble / rest / elite / boon) between rounds.
export type RunStatus = 'combat' | 'choosing' | 'room' | 'boss' | 'gameover' | 'won';
export type RoomId = 'boon' | 'shop' | 'gamble' | 'rest' | 'elite';

interface ArenaRunState {
  active: boolean;
  mode: RunMode;
  round: number; // 1-based current round
  lives: number;
  kills: number;
  status: RunStatus;
  coinsAtStart: number; // to report coins earned this run
  pendingChoices: string[]; // roguelite — the 3 run-buff ids offered between rounds
  pendingRoomId?: RoomId; // Wave 3 — the current interstitial room (when status === 'room')
  roomResult?: string; // Wave 3 — last room outcome text (for the overlay to show after acting)
  eliteNextRound?: boolean; // Wave 3 — elite room flagged the next wave as harder

  start: (mode: RunMode, lives: number, coinsAtStart: number) => void;
  setStatus: (status: RunStatus) => void;
  setRound: (round: number) => void;
  addKill: (n?: number) => void;
  loseLife: () => void;
  addLife: () => void;
  setPendingChoices: (ids: string[]) => void;
  setPendingRoom: (roomId: RoomId | undefined) => void;
  setRoomResult: (text: string | undefined) => void;
  setEliteNextRound: (v: boolean) => void;
  reset: () => void;
}

const INITIAL = { active: false, mode: 'endless' as RunMode, round: 1, lives: 3, kills: 0, status: 'combat' as RunStatus, coinsAtStart: 0, pendingChoices: [] as string[], pendingRoomId: undefined, roomResult: undefined, eliteNextRound: false };

export const useArenaRunStore = create<ArenaRunState>((set) => ({
  ...INITIAL,
  start: (mode, lives, coinsAtStart) => set({ active: true, mode, lives, coinsAtStart, round: 1, kills: 0, status: 'combat', pendingRoomId: undefined, roomResult: undefined, eliteNextRound: false }),
  setStatus: (status) => set({ status }),
  setRound: (round) => set({ round }),
  addKill: (n = 1) => set((s) => ({ kills: s.kills + n })),
  loseLife: () => set((s) => ({ lives: Math.max(0, s.lives - 1) })),
  addLife: () => set((s) => ({ lives: s.lives + 1 })),
  setPendingChoices: (ids) => set({ pendingChoices: ids }),
  setPendingRoom: (roomId) => set({ pendingRoomId: roomId }),
  setRoomResult: (text) => set({ roomResult: text }),
  setEliteNextRound: (v) => set({ eliteNextRound: v }),
  reset: () => set({ ...INITIAL }),
}));

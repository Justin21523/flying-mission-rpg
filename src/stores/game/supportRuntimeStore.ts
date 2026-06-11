import { create } from 'zustand';
import type {
  CharacterPresence,
  ControlOwnershipState,
  SupportDispatchEntry,
  SupportDispatchMode,
  SupportDispatchStatus,
} from '../../types/game/support';

interface SupportToast {
  id: string;
  characterId: string;
  text: string;
  createdAtMs: number;
}

interface SupportRuntimeState {
  panelOpen: boolean;
  dispatches: SupportDispatchEntry[];
  presences: CharacterPresence[];
  ownership: ControlOwnershipState;
  toasts: SupportToast[];
  paused: boolean;
  lastAssistText: string | null;
  setPanelOpen: (open: boolean) => void;
  upsertDispatch: (entry: SupportDispatchEntry) => void;
  updateDispatch: (characterId: string, patch: Partial<SupportDispatchEntry>) => void;
  removeDispatch: (characterId: string) => void;
  upsertPresence: (presence: CharacterPresence) => void;
  updatePresence: (characterId: string, patch: Partial<CharacterPresence>) => void;
  removePresence: (characterId: string) => void;
  setOwnership: (ownership: ControlOwnershipState) => void;
  pushToast: (characterId: string, text: string) => void;
  clearOldToasts: (nowMs: number) => void;
  setPaused: (paused: boolean) => void;
  setLastAssistText: (text: string | null) => void;
  reset: () => void;
}

const initialOwnership: ControlOwnershipState = {
  controlledCharacterId: null,
  inputOwnerId: null,
  cameraOwnerId: null,
  hudFocusCharacterId: null,
  switching: false,
};

export function makeDispatchEntry(characterId: string, mode: SupportDispatchMode, nowMs: number): SupportDispatchEntry {
  return {
    characterId,
    mode,
    status: 'queued',
    requestedAtMs: nowMs,
    stageStartedAtMs: nowMs,
    elapsedSeconds: 0,
    etaSeconds: 0,
    paused: false,
    cancelled: false,
  };
}

export function statusToTier(status: SupportDispatchStatus): CharacterPresence['tier'] | null {
  if (status === 'active-at-scene') return 'active';
  if (status === 'standby-at-scene') return 'standby';
  if (status === 'remote-support') return 'remote';
  return null;
}

export const useSupportRuntimeStore = create<SupportRuntimeState>((set, get) => ({
  panelOpen: false,
  dispatches: [],
  presences: [],
  ownership: initialOwnership,
  toasts: [],
  paused: false,
  lastAssistText: null,

  setPanelOpen: (panelOpen) => set({ panelOpen }),

  upsertDispatch: (entry) =>
    set((s) => ({
      dispatches: s.dispatches.some((d) => d.characterId === entry.characterId)
        ? s.dispatches.map((d) => (d.characterId === entry.characterId ? entry : d))
        : [...s.dispatches, entry],
    })),

  updateDispatch: (characterId, patch) =>
    set((s) => ({ dispatches: s.dispatches.map((d) => (d.characterId === characterId ? { ...d, ...patch } : d)) })),

  removeDispatch: (characterId) => set((s) => ({ dispatches: s.dispatches.filter((d) => d.characterId !== characterId) })),

  upsertPresence: (presence) =>
    set((s) => ({
      presences: s.presences.some((p) => p.characterId === presence.characterId)
        ? s.presences.map((p) => (p.characterId === presence.characterId ? presence : p))
        : [...s.presences, presence],
    })),

  updatePresence: (characterId, patch) =>
    set((s) => ({ presences: s.presences.map((p) => (p.characterId === characterId ? { ...p, ...patch } : p)) })),

  removePresence: (characterId) => set((s) => ({ presences: s.presences.filter((p) => p.characterId !== characterId) })),

  setOwnership: (ownership) => set({ ownership }),
  pushToast: (characterId, text) =>
    set((s) => ({ toasts: [...s.toasts, { id: `${characterId}_${Date.now().toString(36)}`, characterId, text, createdAtMs: Date.now() }] })),
  clearOldToasts: (nowMs) => set((s) => ({ toasts: s.toasts.filter((t) => nowMs - t.createdAtMs < 4500) })),
  setPaused: (paused) => set({ paused, dispatches: get().dispatches.map((d) => ({ ...d, paused })) }),
  setLastAssistText: (lastAssistText) => set({ lastAssistText }),
  reset: () => set({ panelOpen: false, dispatches: [], presences: [], ownership: initialOwnership, toasts: [], paused: false, lastAssistText: null }),
}));

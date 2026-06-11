import { create } from 'zustand';

// Kit — arbitrary boolean world flags (story progress, "talked to X", switches). Read/written by dialogue
// conditions & effects and the interaction handler. Generic; no game-specific keys. Auto-persisted to
// localStorage so progress flags — including the `mission:<id>:done` flags that record completed missions and
// drive map/region unlock — survive a page reload (named save slots still snapshot these too).
interface FlagState {
  flags: Record<string, boolean>;
  setFlag: (key: string, value?: boolean) => void;
  hasFlag: (key: string) => boolean;
  setFlags: (flags: Record<string, boolean>) => void;
  reset: () => void;
}

const STORAGE_KEY = 'aero-rescue-flags-v1';

function persist(flags: Record<string, boolean>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ flags })); } catch { /* ignore */ }
}
function load(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { const p = JSON.parse(raw); if (p && typeof p.flags === 'object' && p.flags) return p.flags as Record<string, boolean>; }
  } catch { /* ignore */ }
  return {};
}

export const useFlagStore = create<FlagState>((set, get) => ({
  flags: load(),
  setFlag: (key, value = true) => { const flags = { ...get().flags, [key]: value }; set({ flags }); persist(flags); },
  hasFlag: (key) => get().flags[key] === true,
  setFlags: (flags) => { set({ flags }); persist(flags); },
  reset: () => { set({ flags: {} }); persist({}); },
}));

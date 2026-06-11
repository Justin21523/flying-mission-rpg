import { create } from 'zustand';
import type { HuntConfig } from '../../types/game/hunt';
import { DEFAULT_HUNT_CONFIG } from '../../types/game/hunt';
import { useYokaiCombatStore } from '../yokaiCombatStore';

// Destination yokai-hunt runtime + persisted config. start() opens a timed endless-spawn session (the layer
// spawns/AI/renders); tick() runs the clock; defeats are counted by yokaiCombatStore.kills. Edit/play shared.
const STORAGE_KEY = 'aero-rescue-hunt-config-v1';

function persist(config: HuntConfig): void { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ config })); } catch { /* ignore */ } }
function load(): HuntConfig {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const p = JSON.parse(raw); if (p?.config) return { ...DEFAULT_HUNT_CONFIG, ...p.config }; } } catch { /* ignore */ }
  return { ...DEFAULT_HUNT_CONFIG };
}

interface HuntState {
  config: HuntConfig;
  active: boolean;
  timeLeft: number;
  endedAt: number; // perf-time the last hunt ended (for a brief result banner)
  setConfig: (patch: Partial<HuntConfig>) => void;
  start: () => void;
  stop: () => void;
  tick: (dt: number) => void;
  nibble: (sec: number) => void; // a yokai hit shaves the clock
  importState: (data: { config?: HuntConfig }) => void;
  reset: () => void;
}

export const useHuntStore = create<HuntState>((set, get) => ({
  config: load(),
  active: false,
  timeLeft: 0,
  endedAt: 0,
  setConfig: (patch) => { const config = { ...get().config, ...patch }; set({ config }); persist(config); },
  start: () => {
    if (get().active) return;
    useYokaiCombatStore.getState().start();
    set({ active: true, timeLeft: get().config.durationSec });
  },
  stop: () => {
    if (!get().active) return;
    useYokaiCombatStore.getState().stop();
    set({ active: false, timeLeft: 0, endedAt: performance.now() / 1000 });
  },
  tick: (dt) => {
    if (!get().active) return;
    const timeLeft = get().timeLeft - dt;
    if (timeLeft <= 0) { get().stop(); return; }
    set({ timeLeft });
  },
  nibble: (sec) => { if (get().active) set({ timeLeft: Math.max(0, get().timeLeft - sec) }); },
  importState: (data) => { const config = data.config ? { ...DEFAULT_HUNT_CONFIG, ...data.config } : get().config; set({ config }); persist(config); },
  reset: () => { const config = { ...DEFAULT_HUNT_CONFIG }; set({ config, active: false, timeLeft: 0 }); persist(config); },
}));

// Central entry every trigger (dialogue effect / objective / auto director / zone) calls.
export function startDestinationHunt(): void {
  useHuntStore.getState().start();
}

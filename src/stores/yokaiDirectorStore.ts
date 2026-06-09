import { create } from 'zustand';

// POLI yokai-hunt — config for the random director that starts yokai hunts on its own (editable in the
// 🎮 Mini-games tab). Persisted to localStorage. The director (YokaiDirector) starts an eligible enemyRush
// activity in the player's current area at roughly `intervalSec`, with `chance` probability per attempt.
interface YokaiDirectorState {
  enabled: boolean;
  intervalSec: number;
  chance: number;       // 0..1 probability each interval that a hunt actually starts
  set: (patch: Partial<Pick<YokaiDirectorState, 'enabled' | 'intervalSec' | 'chance'>>) => void;
}

const KEY = 'r3f-rpg-builder-poli-yokai-director-v1';
const load = (): { enabled: boolean; intervalSec: number; chance: number } => {
  try { const r = localStorage.getItem(KEY); if (r) { const p = JSON.parse(r); return { enabled: p.enabled ?? true, intervalSec: p.intervalSec ?? 45, chance: p.chance ?? 0.6 }; } } catch { /* ignore */ }
  return { enabled: true, intervalSec: 45, chance: 0.6 };
};

export const useYokaiDirectorStore = create<YokaiDirectorState>((set, get) => ({
  ...load(),
  set: (patch) => {
    set(patch);
    const s = get();
    try { localStorage.setItem(KEY, JSON.stringify({ enabled: s.enabled, intervalSec: s.intervalSec, chance: s.chance })); } catch { /* ignore */ }
  },
}));

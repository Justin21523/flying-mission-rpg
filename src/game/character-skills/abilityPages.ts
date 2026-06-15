import { create } from 'zustand';
import type { AbilitySlot } from '../../types/abilityArsenalTypes';

// Paged ability input (Batch F.5 redesign) — instead of 11 separate keys, each hero's 11 abilities are split
// into PAGES of 4, cast with just 4 action keys (4 / 5 / Z / X). Ctrl cycles the active page. So the same 4
// keys map to a different ability set per page.
export const ABILITY_PAGES: AbilitySlot[][] = [
  ['attack-1', 'attack-2', 'attack-3', 'attack-4'],     // Page 1 — core attacks
  ['attack-5', 'attack-6', 'defense-1', 'defense-2'],   // Page 2 — extra attacks + defense
  ['defense-3', 'ultimate-1', 'ultimate-2'],            // Page 3 — defense + ultimates
];
export const PAGE_COUNT = ABILITY_PAGES.length;
export const PAGE_LABELS = ['Attacks', 'Attacks · Defense', 'Defense · Ultimate'];

// The 4 action keys → index within the active page. (Digit4 = the "4" key, Digit5 = "5".)
export const ACTION_KEYS = ['Digit4', 'Digit5', 'KeyZ', 'KeyX'] as const;
export const ACTION_KEY_LABELS = ['4', '5', 'Z', 'X'];

export function actionKeyIndex(code: string): number {
  return (ACTION_KEYS as readonly string[]).indexOf(code);
}

// Resolve an action key on the given page → the ability slot it casts (or undefined if that page slot is empty).
export function routeActionKey(code: string, page: number): AbilitySlot | undefined {
  const idx = actionKeyIndex(code);
  if (idx < 0) return undefined;
  return ABILITY_PAGES[page % PAGE_COUNT]?.[idx];
}

// Active page state (Ctrl cycles it). UI subscribes so the skill bar re-renders on page switch.
interface AbilityPageState {
  page: number;
  cyclePage: () => void;
  setPage: (page: number) => void;
  reset: () => void;
}
export const useAbilityPageStore = create<AbilityPageState>((set, get) => ({
  page: 0,
  cyclePage: () => set({ page: (get().page + 1) % PAGE_COUNT }),
  setPage: (page) => set({ page: ((page % PAGE_COUNT) + PAGE_COUNT) % PAGE_COUNT }),
  reset: () => set({ page: 0 }),
}));

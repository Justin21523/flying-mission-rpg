import { describe, it, expect, beforeEach } from 'vitest';
import { ABILITY_PAGES, PAGE_COUNT, routeActionKey, useAbilityPageStore } from '../../game/character-skills/abilityPages';
import { ABILITY_SLOTS } from '../../types/abilityArsenalTypes';

describe('Paged ability input (4 / 5 / Z / X + Ctrl)', () => {
  beforeEach(() => useAbilityPageStore.getState().reset());

  it('is exactly 4 pages of 4 slots covering all 16 ability slots once', () => {
    expect(ABILITY_PAGES).toHaveLength(4);
    for (const pg of ABILITY_PAGES) expect(pg).toHaveLength(4);
    const flat = ABILITY_PAGES.flat();
    expect(flat.length).toBe(16);
    expect(new Set(flat).size).toBe(16);
    for (const s of ABILITY_SLOTS) expect(flat).toContain(s);
  });

  it('every page has exactly one clone slot (clones interleaved, not all on the last page)', () => {
    for (const pg of ABILITY_PAGES) {
      expect(pg.filter((s) => s.startsWith('clone-')).length).toBe(1);
    }
  });

  it('routes the 4 action keys to a DIFFERENT ability per page (no empty slot)', () => {
    expect(ABILITY_PAGES[0]).toEqual(['attack-1', 'clone-1', 'attack-2', 'attack-3']);
    expect(ABILITY_PAGES[1]).toEqual(['attack-4', 'defense-1', 'clone-2', 'attack-5']);
    expect(ABILITY_PAGES[2]).toEqual(['attack-6', 'defense-2', 'signature-1', 'clone-3']);
    expect(ABILITY_PAGES[3]).toEqual(['defense-3', 'ultimate-1', 'clone-4', 'ultimate-2']);
    expect(routeActionKey('Digit4', 0)).toBe('attack-1');
    expect(routeActionKey('Digit5', 0)).toBe('clone-1');
    expect(routeActionKey('KeyZ', 1)).toBe('clone-2');
    expect(routeActionKey('KeyX', 2)).toBe('clone-3');
    expect(routeActionKey('KeyZ', 3)).toBe('clone-4');
    expect(routeActionKey('KeyX', 3)).toBe('ultimate-2');
    expect(routeActionKey('KeyP', 0)).toBeUndefined(); // not an action key
  });

  it('Ctrl cycles 0 → 1 → 2 → 3 → 0', () => {
    expect(PAGE_COUNT).toBe(4);
    const seen: number[] = [];
    for (let i = 0; i < 5; i++) { seen.push(useAbilityPageStore.getState().page); useAbilityPageStore.getState().cyclePage(); }
    expect(seen).toEqual([0, 1, 2, 3, 0]);
  });
});

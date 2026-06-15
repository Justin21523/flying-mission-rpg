import { describe, it, expect, beforeEach } from 'vitest';
import { ABILITY_PAGES, PAGE_COUNT, routeActionKey, useAbilityPageStore } from '../../game/character-skills/abilityPages';
import { ABILITY_SLOTS } from '../../types/abilityArsenalTypes';

describe('Paged ability input (4 / 5 / Z / X + Ctrl)', () => {
  beforeEach(() => useAbilityPageStore.getState().reset());

  it('covers all 11 ability slots exactly once across the pages', () => {
    const flat = ABILITY_PAGES.flat();
    expect(flat.length).toBe(11);
    expect(new Set(flat).size).toBe(11);
    for (const s of ABILITY_SLOTS) expect(flat).toContain(s);
  });

  it('routes the 4 action keys to the active page slots', () => {
    expect(routeActionKey('Digit4', 0)).toBe('attack-1');
    expect(routeActionKey('Digit5', 0)).toBe('attack-2');
    expect(routeActionKey('KeyZ', 0)).toBe('attack-3');
    expect(routeActionKey('KeyX', 0)).toBe('attack-4');
    expect(routeActionKey('Digit4', 1)).toBe('attack-5');
    expect(routeActionKey('KeyX', 2)).toBeUndefined(); // page 3 has only 3 abilities
    expect(routeActionKey('KeyP', 0)).toBeUndefined(); // not an action key
  });

  it('Ctrl cycles the page and wraps around', () => {
    expect(useAbilityPageStore.getState().page).toBe(0);
    useAbilityPageStore.getState().cyclePage();
    expect(useAbilityPageStore.getState().page).toBe(1);
    for (let i = 0; i < PAGE_COUNT; i++) useAbilityPageStore.getState().cyclePage();
    expect(useAbilityPageStore.getState().page).toBe(1); // +3 more wraps back to 1
  });
});

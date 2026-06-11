import { describe, it, expect } from 'vitest';
import { pickActiveDialogueTreeId, npcDialogueTreeIds, npcDefaults } from './npcDialogueSelect';
import type { DialogueTree } from '../../types/dialogue';

const tree = (id: string, condition?: DialogueTree['condition']): DialogueTree => ({ id, rootNodeId: 'start', nodes: {}, condition });

describe('pickActiveDialogueTreeId', () => {
  const trees = {
    a: tree('a', { type: 'questCompleted', targetId: 'q1' }),
    b: tree('b'), // no condition → always eligible
    c: tree('c', { type: 'worldFlagSet', flag: 'f' }),
  };
  it('returns the first tree whose condition passes (in NPC order)', () => {
    const pass = (c: NonNullable<DialogueTree['condition']>) => c.type === 'worldFlagSet';
    // a fails, b has no condition → b wins (comes before c)
    expect(pickActiveDialogueTreeId(trees, ['a', 'b', 'c'], pass)).toBe('b');
    // order matters: c first → c passes
    expect(pickActiveDialogueTreeId(trees, ['a', 'c', 'b'], pass)).toBe('c');
  });
  it('skips ids with no real tree', () => {
    expect(pickActiveDialogueTreeId(trees, ['missing', 'a'], () => true)).toBe('a');
  });
  it('returns null when nothing resolves', () => {
    expect(pickActiveDialogueTreeId(trees, ['a', 'c'], () => false)).toBeNull();
    expect(pickActiveDialogueTreeId(trees, [], () => true)).toBeNull();
  });
});

describe('npcDialogueTreeIds', () => {
  it('prefers the multi-tree list, falls back to the single id', () => {
    expect(npcDialogueTreeIds({ dialogueTreeIds: ['x', 'y'] })).toEqual(['x', 'y']);
    expect(npcDialogueTreeIds({ dialogueTreeId: 'z' })).toEqual(['z']);
    expect(npcDialogueTreeIds({})).toEqual([]);
  });
});

describe('npcDefaults', () => {
  it('maps an archetype to a role + colour', () => {
    const d = npcDefaults('vendor');
    expect(d.role).toBeTruthy();
    expect(d.color).toMatch(/^#/);
  });
  it('blank for no archetype', () => {
    expect(npcDefaults(undefined).role).toBe('');
  });
});

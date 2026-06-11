import { describe, it, expect } from 'vitest';
import { pickLoopRule } from './animRunner';
import type { AnimRule } from '../../types/character';

// A character's authored rules resolve the right clip per state (reusing the POLI rule engine that the
// game presenters feed live AnimState into). All clips assumed present.
const RULES: AnimRule[] = [
  { id: 'r1', clip: 'fly', trigger: 'flying', priority: 5 },
  { id: 'r2', clip: 'idle', trigger: 'idle', priority: 0 },
  { id: 'r3', clip: 'cheer', trigger: 'ability', priority: 9 },
  { id: 'r4', clip: 'wave', trigger: 'key', key: 'KeyV', priority: 10 },
];
const has = () => true;

describe('character animation rules (pickLoopRule)', () => {
  it('flying state picks the flying clip', () => {
    expect(pickLoopRule(RULES, { speed: 5, moving: true, flying: true }, has)?.clip).toBe('fly');
  });
  it('idle state picks the idle clip', () => {
    expect(pickLoopRule(RULES, { speed: 0, moving: false }, has)?.clip).toBe('idle');
  });
  it('ability beats flying by priority', () => {
    expect(pickLoopRule(RULES, { speed: 5, moving: true, flying: true, ability: true }, has)?.clip).toBe('cheer');
  });
  it('key trigger fires when the key is down (highest priority)', () => {
    expect(pickLoopRule(RULES, { speed: 0, moving: false, ability: true, keyDown: (c) => c === 'KeyV' }, has)?.clip).toBe('wave');
  });
  it('a clip missing from the model is skipped (no lower rule for this state → none)', () => {
    expect(pickLoopRule(RULES, { speed: 5, moving: true, flying: true }, (c) => c !== 'fly')).toBeNull();
  });
  it('falls back to a lower-priority matching rule when the top clip is missing', () => {
    const rules: AnimRule[] = [
      { id: 'a', clip: 'fly', trigger: 'always', priority: 5 },
      { id: 'b', clip: 'base', trigger: 'always', priority: 0 },
    ];
    expect(pickLoopRule(rules, { speed: 0, moving: false }, (c) => c !== 'fly')?.clip).toBe('base');
  });
});

import { describe, it, expect } from 'vitest';
import { moveItem } from './arrayMove';

describe('moveItem', () => {
  it('moves down (+1) swapping neighbours', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
  });
  it('moves up (-1) swapping neighbours', () => {
    expect(moveItem(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
  });
  it('is a no-op at the bounds', () => {
    expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
  });
  it('returns a new array (immutable)', () => {
    const src = ['a', 'b'];
    const out = moveItem(src, 0, 1);
    expect(out).not.toBe(src);
    expect(src).toEqual(['a', 'b']);
  });
});

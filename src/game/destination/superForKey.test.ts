import { describe, it, expect } from 'vitest';
import { superForKey } from './superForKey';
import type { SuperMove } from '../../types/character';

const mv = (id: string): SuperMove => ({ id, name: id, kind: 'nova', color: '#fff', damage: 1, cooldownSec: 1 });

describe('superForKey', () => {
  const supers = [mv('a'), mv('b'), mv('c')];
  it('maps Digit1-6 to the matching slot', () => {
    expect(superForKey(supers, 'Digit1')?.id).toBe('a');
    expect(superForKey(supers, 'Digit3')?.id).toBe('c');
  });
  it('null for unbound slots and non-digit keys', () => {
    expect(superForKey(supers, 'Digit4')).toBeNull();
    expect(superForKey(supers, 'Digit6')).toBeNull();
    expect(superForKey(supers, 'KeyF')).toBeNull();
    expect(superForKey(undefined, 'Digit1')).toBeNull();
  });
});

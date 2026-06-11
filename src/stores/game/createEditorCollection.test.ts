import { describe, it, expect, beforeEach } from 'vitest';
import { createEditorCollection } from './createEditorCollection';

interface Row { id: string }
const makeStore = () => createEditorCollection<Row>({ storageKey: `test-coll-${Math.random()}`, seed: [], makeId: () => `id_${Math.random()}` });

describe('createEditorCollection.reorder', () => {
  let store: ReturnType<typeof makeStore>;
  beforeEach(() => {
    store = makeStore();
    store.getState().importState({ items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] });
  });

  it('moves an item down (+1)', () => {
    store.getState().reorder('a', 1);
    expect(store.getState().items.map((i) => i.id)).toEqual(['b', 'a', 'c']);
  });
  it('moves an item up (-1)', () => {
    store.getState().reorder('c', -1);
    expect(store.getState().items.map((i) => i.id)).toEqual(['a', 'c', 'b']);
  });
  it('is a no-op at the bounds', () => {
    store.getState().reorder('a', -1);
    store.getState().reorder('c', 1);
    expect(store.getState().items.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });
  it('unknown id → no-op', () => {
    store.getState().reorder('zzz', 1);
    expect(store.getState().items.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });
});

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

interface Row2 { id: string; v: number }

describe('createEditorCollection.reconcileFromSeed', () => {
  it('without seedVersion behaves like mergeMissingFromSeed (no overwrite)', () => {
    const key = `test-recon-${Math.random()}`;
    const seed = [{ id: 'a', v: 2 }];
    localStorage.setItem(key, JSON.stringify({ items: [{ id: 'a', v: 1 }], seeded: true }));
    const store = createEditorCollection<Row2>({ storageKey: key, seed, makeId: () => 'x' });
    store.getState().reconcileFromSeed();
    expect(store.getState().items.find((i) => i.id === 'a')?.v).toBe(1); // kept stale (no version)
  });

  it('refreshes seed-owned items on a version bump, keeps user-only items', () => {
    const key = `test-recon-${Math.random()}`;
    // persisted with OLD content + no version, plus a user-created row not in the seed.
    localStorage.setItem(key, JSON.stringify({ items: [{ id: 'a', v: 1 }, { id: 'user', v: 9 }], seeded: true }));
    const seed = [{ id: 'a', v: 2 }, { id: 'b', v: 2 }];
    const store = createEditorCollection<Row2>({ storageKey: key, seed, makeId: () => 'x', seedVersion: 'v2' });
    store.getState().reconcileFromSeed();
    const items = store.getState().items;
    expect(items.find((i) => i.id === 'a')?.v).toBe(2);   // refreshed from seed
    expect(items.find((i) => i.id === 'b')?.v).toBe(2);   // newly added from seed
    expect(items.find((i) => i.id === 'user')?.v).toBe(9); // user-only item preserved
  });

  it('does not re-overwrite once the version matches', () => {
    const key = `test-recon-${Math.random()}`;
    const seed = [{ id: 'a', v: 2 }];
    const store = createEditorCollection<Row2>({ storageKey: key, seed, makeId: () => 'x', seedVersion: 'v2' });
    store.getState().reconcileFromSeed();            // seeds + records v2
    store.getState().update('a', { v: 5 });          // user tweak after reseed
    store.getState().reconcileFromSeed();            // same version → must NOT clobber the tweak
    expect(store.getState().items.find((i) => i.id === 'a')?.v).toBe(5);
  });
});
